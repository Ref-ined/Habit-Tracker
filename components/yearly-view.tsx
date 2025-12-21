"use client";

import { useState } from "react";
import { format, eachDayOfInterval, startOfYear, endOfYear, subYears, addYears, isSameDay, getDay, isSameYear } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Habit = {
    id: string;
    title: string;
    color: string;
};

type HabitLog = {
    habit_id: string;
    completed_at: string; // YYYY-MM-DD
};

interface YearlyViewProps {
    logs: HabitLog[];
    habits: Habit[]; // Need habits map to show titles in details
    currentDate?: Date;
    readOnly?: boolean;
}

export default function YearlyView({ logs, habits, currentDate = new Date(), readOnly = false }: YearlyViewProps) {
    const [viewDate, setViewDate] = useState(currentDate);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Nav Handlers
    const prevYear = () => setViewDate(subYears(viewDate, 1));
    const nextYear = () => setViewDate(addYears(viewDate, 1));
    const goToday = () => setViewDate(new Date());

    // Generate days for the current year
    const yearStart = startOfYear(viewDate);
    const yearEnd = endOfYear(viewDate);
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

    // Calculate intensity per day (Total habits completed on that day)
    const dailyCounts = new Map<string, number>();
    logs.forEach(log => {
        const current = dailyCounts.get(log.completed_at) || 0;
        dailyCounts.set(log.completed_at, current + 1);
    });

    // Calculate generic max for scaling color intensity
    const maxCount = Math.max(...Array.from(dailyCounts.values()), 1);

    // Get habits for selected date
    const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
    const habitsCompletedOnSelectedDate = selectedDateStr
        ? logs
            .filter(l => l.completed_at === selectedDateStr)
            .map(l => habits.find(h => h.id === l.habit_id))
            .filter(Boolean) as Habit[]
        : [];

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border shrink-0">
                        <Button variant="ghost" size="icon" onClick={prevYear} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        <h2 className="text-sm sm:text-lg font-semibold text-foreground min-w-[80px] sm:min-w-[120px] text-center select-none uppercase tracking-widest">
                            {format(viewDate, "yyyy")}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={nextYear} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                    </div>

                    {!isSameYear(viewDate, new Date()) && (
                        <Button variant="outline" size="sm" onClick={goToday} className="h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                            Today
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-card/50 border border-border rounded-xl p-3 sm:p-6 overflow-x-auto w-full no-scrollbar backdrop-blur-sm shadow-xl">
                <div className="flex gap-2 min-w-max mx-auto justify-start xl:justify-center">
                    {/* Days Labels (Mon, Wed, Fri) */}
                    <div className="flex flex-col gap-[9px] pt-[24px] sm:pt-[28px] text-[9px] sm:text-xs text-muted-foreground pr-1 sm:pr-2 font-medium">
                        <div className="h-4 flex items-center">Mon</div>
                        <div className="h-4 flex items-center mt-[11px] sm:mt-[14px]">Wed</div>
                        <div className="h-4 flex items-center mt-[11px] sm:mt-[14px]">Fri</div>
                    </div>

                    {/* Grid */}
                    <div className="flex gap-[2px] sm:gap-[3px]">
                        <HeatmapGrid
                            days={days}
                            dailyCounts={dailyCounts}
                            maxCount={maxCount}
                            onDayClick={setSelectedDate}
                        />
                    </div>
                </div>
            </div>

            {/* Details Dialog */}
            <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedDate && format(selectedDate, "EEEE, MMMM do, yyyy")}</DialogTitle>
                        <DialogDescription>
                            {habitsCompletedOnSelectedDate.length} habits completed
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[300px] mt-4">
                        <div className="space-y-2 pr-4">
                            {habitsCompletedOnSelectedDate.map(habit => (
                                <div key={habit.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: habit.color }}>
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                    </div>
                                    <div className="font-medium">{habit.title}</div>
                                </div>
                            ))}
                            {habitsCompletedOnSelectedDate.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">
                                    No activity for this day.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function HeatmapGrid({
    days,
    dailyCounts,
    maxCount,
    onDayClick
}: {
    days: Date[],
    dailyCounts: Map<string, number>,
    maxCount: number,
    onDayClick: (date: Date) => void
}) {
    // Group days by week
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Pad first week
    const firstDay = days[0];
    const firstDayIndex = getDay(firstDay); // 0=Sun...
    // Let's assume we want Mon start (1). 
    const emptySlots = (firstDayIndex + 6) % 7;

    for (let i = 0; i < emptySlots; i++) {
        currentWeek.push(null as any);
    }

    days.forEach(day => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    return (
        <>
            {weeks.map((week, idx) => (
                <div key={idx} className="flex flex-col gap-[3px]">
                    {/* Month Label */}
                    <div className="h-4 mb-2 text-[10px] text-muted-foreground font-medium text-center">
                        {week.find(d => d && d.getDate() <= 7) && format(week.find(d => d && d.getDate() <= 7)!, "MMM")}
                    </div>

                    {week.map((day, dIdx) => {
                        if (!day) return <div key={dIdx} className="w-5 h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />;

                        const dateStr = format(day, "yyyy-MM-dd");
                        const count = dailyCounts.get(dateStr) || 0;
                        const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 4); // 0-4 scale

                        // Colors
                        const colors = [
                            "bg-muted", // 0
                            "bg-indigo-900/60 dark:bg-indigo-900/60 bg-indigo-200", // 1
                            "bg-indigo-700/60 dark:bg-indigo-700/60 bg-indigo-300", // 2
                            "bg-indigo-500/80 dark:bg-indigo-500/80 bg-indigo-400", // 3
                            "bg-indigo-400 dark:bg-indigo-400 bg-indigo-500"     // 4
                        ];

                        return (
                            <Tooltip key={dateStr}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => onDayClick(day)}
                                        className={cn(
                                            "w-5 h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 rounded-[3px] transition-all border border-transparent hover:border-foreground/50 hover:scale-110",
                                            colors[intensity]
                                        )}
                                    />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">
                                    {count} habits on {format(day, "MMM d, yyyy")}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            ))}
        </>
    )
}
