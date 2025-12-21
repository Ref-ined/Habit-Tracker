"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { format, getDaysInMonth, startOfMonth, addDays, subDays, addMonths, subMonths, isSameMonth } from "date-fns";
import { Check, Trash2, Plus, Flame, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toggleHabitCompletion, deleteHabit, createHabit, updateHabit } from "@/app/actions/habits";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


type Habit = {
    id: string;
    title: string;
    color: string;
};

type HabitLog = {
    habit_id: string;
    completed_at: string; // YYYY-MM-DD
    notes?: string;
};

interface HabitGridProps {
    initialHabits: Habit[];
    initialLogs: HabitLog[];
    currentDate?: Date;
    readOnly?: boolean;
}

export default function HabitGrid({ initialHabits, initialLogs, currentDate = new Date(), readOnly = false }: HabitGridProps) {
    const [habits, setHabits] = useState(initialHabits);
    const [logs, setLogs] = useState<Set<string>>(new Set(initialLogs.map(l => `${l.habit_id}-${l.completed_at}`)));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [viewDate, setViewDate] = useState(currentDate);
    const router = useRouter();

    const daysInMonth = getDaysInMonth(viewDate);
    const monthStart = startOfMonth(viewDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i));

    // Map for fast note lookup
    const notesMap = new Map(initialLogs.map(l => [`${l.habit_id}-${l.completed_at}`, l.notes]));

    // Update local state when props change
    useEffect(() => {
        setLogs(new Set(initialLogs.map(l => `${l.habit_id}-${l.completed_at}`)));
    }, [initialLogs]);

    useEffect(() => {
        setHabits(initialHabits);
    }, [initialHabits]);



    const calculateStreak = (habitId: string) => {
        let streak = 0;
        const today = new Date();
        const yesterday = subDays(today, 1);

        let checkDate = today;
        if (!logs.has(`${habitId}-${format(today, "yyyy-MM-dd")}`)) {
            if (logs.has(`${habitId}-${format(yesterday, "yyyy-MM-dd")}`)) {
                checkDate = yesterday;
            } else {
                return 0;
            }
        }

        while (true) {
            if (logs.has(`${habitId}-${format(checkDate, "yyyy-MM-dd")}`)) {
                streak++;
                checkDate = subDays(checkDate, 1);
            } else {
                break;
            }
        }
        return streak;
    };

    const handleToggle = async (habitId: string, day: Date) => {
        if (readOnly) return;

        const dateStr = format(day, "yyyy-MM-dd");
        const key = `${habitId}-${dateStr}`;

        // Optimistic Update
        const isCompleted = logs.has(key);
        const newLogs = new Set(logs);
        if (isCompleted) {
            newLogs.delete(key);
        } else {
            newLogs.add(key);
        }
        setLogs(newLogs);

        const result = await toggleHabitCompletion(habitId, dateStr);
        if (result?.error) {
            setLogs(logs); // Revert
            toast.error("Failed to update habit");
        }
    };

    const handleDelete = async (habitId: string) => {
        if (readOnly) return;
        const oldHabits = [...habits];
        setHabits(habits.filter(h => h.id !== habitId));

        const result = await deleteHabit(habitId);
        if (result?.error) {
            setHabits(oldHabits);
            toast.error(result.error);
        } else {
            toast.success("Habit deleted");
            router.refresh();
        }
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const result = await createHabit(formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Habit created");
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingHabit) return;

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const result = await updateHabit(editingHabit.id, formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Habit updated");
            setEditingHabit(null);
            router.refresh();
        }
        setIsSubmitting(false);
    };

    // Nav Handlers
    const prevMonth = () => setViewDate(subMonths(viewDate, 1));
    const nextMonth = () => setViewDate(addMonths(viewDate, 1));
    const goToday = () => setViewDate(new Date());

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border shrink-0">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        <h2 className="text-sm sm:text-lg font-semibold text-foreground min-w-[100px] sm:min-w-[140px] text-center select-none">
                            {format(viewDate, "MMMM yyyy")}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                    </div>

                    {!isSameMonth(viewDate, new Date()) && (
                        <Button variant="outline" size="sm" onClick={goToday} className="h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                            Today
                        </Button>
                    )}
                </div>

                {!readOnly && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs sm:text-sm">
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> New Habit
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Habit</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Habit Title</Label>
                                    <Input name="title" placeholder="e.g. Read 10 mins" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <Input name="color" type="color" defaultValue="#6366f1" className="h-10 p-1 cursor-pointer" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create Habit"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Edit Dialog */}
            {!readOnly && (
                <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Habit</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Habit Title</Label>
                                <Input name="title" defaultValue={editingHabit?.title} placeholder="e.g. Read 10 mins" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <Input name="color" type="color" defaultValue={editingHabit?.color} className="h-10 p-1 cursor-pointer" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex min-w-fit sm:w-full">
                        {/* Habits Column */}
                        <div className="sticky left-0 z-20 w-[140px] sm:w-[200px] bg-card border-r border-border flex flex-col shrink-0">
                            <div className="h-10 sm:h-12 border-b border-border flex items-center px-3 sm:px-4 font-medium text-muted-foreground text-[10px] sm:text-sm">
                                Habit
                            </div>
                            {habits.map(habit => {
                                const streak = calculateStreak(habit.id);
                                return (
                                    <div key={habit.id} className="h-10 sm:h-12 border-b border-border/50 last:border-0 flex items-center px-3 sm:px-4 justify-between group hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-1.5 sm:gap-2 truncate flex-1 min-w-0">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                                            <span className="text-[13px] sm:text-[15px] font-medium truncate text-foreground" title={habit.title}>{habit.title}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 sm:gap-1">
                                            {/* Streak Indicator */}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn("flex items-center gap-0.5 text-[9px] sm:text-xs font-semibold cursor-help select-none", streak > 0 ? "text-orange-500" : "text-muted-foreground")}>
                                                        <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill={streak > 0 ? "currentColor" : "none"} />
                                                        <span>{streak}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-[10px] sm:text-xs">
                                                    Current Streak: {streak} days
                                                </TooltipContent>
                                            </Tooltip>

                                            {!readOnly && (
                                                <>
                                                    <button
                                                        onClick={() => setEditingHabit(habit)}
                                                        className="text-muted-foreground hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 sm:p-1"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(habit.id)}
                                                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5 sm:p-1"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {habits.length === 0 && (
                                <div className="h-20 sm:h-24 flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground px-4 text-center">
                                    No habits yet.
                                </div>
                            )}
                        </div>

                        {/* Days Grid */}
                        <div className="flex flex-col">
                            {/* Header Row */}
                            <div className="flex h-10 sm:h-12 border-b border-border">
                                {days.map((day) => (
                                    <div key={day.toISOString()} className={cn(
                                        "w-[50px] sm:w-[48px] flex flex-col items-center justify-center shrink-0 border-r border-border/50 bg-muted/30",
                                        format(day, "ee") === "01" && "bg-muted/20"
                                    )}>
                                        <span className="text-[10px] sm:text-xs text-muted-foreground uppercase leading-none mb-1">{format(day, "EEEEE")}</span>
                                        <span className={cn(
                                            "text-sm sm:text-base font-bold",
                                            format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "text-indigo-500" : "text-foreground"
                                        )}>{format(day, "d")}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Grid Rows */}
                            {habits.map((habit) => (
                                <div key={habit.id} className="flex h-10 sm:h-12 border-b border-border/50 last:border-0 group hover:bg-muted/30 transition-colors">
                                    {days.map((day) => {
                                        const dateStr = format(day, "yyyy-MM-dd");
                                        const key = `${habit.id}-${dateStr}`;
                                        const isCompleted = logs.has(key);
                                        const note = notesMap.get(key);

                                        return (
                                            <div key={day.toISOString()} className="w-[50px] sm:w-[48px] border-r border-border/50 flex items-center justify-center shrink-0 relative">
                                                <Tooltip delayDuration={300}>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => !readOnly && handleToggle(habit.id, day)}
                                                            disabled={readOnly}
                                                            className={cn(
                                                                "w-[30px] h-[30px] sm:w-[38px] sm:h-[38px] rounded-md flex items-center justify-center transition-all duration-200 relative",
                                                                isCompleted ? "text-white shadow-sm scale-100" : "bg-muted/30 hover:bg-muted text-transparent scale-90 hover:scale-100",
                                                                readOnly && "cursor-default hover:scale-90 opacity-80"
                                                            )}
                                                            style={{ backgroundColor: isCompleted ? habit.color : undefined }}
                                                        >
                                                            <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
                                                            {isCompleted && note && (
                                                                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 border border-border" />
                                                            )}
                                                        </button>
                                                    </TooltipTrigger>
                                                    {isCompleted && note && (
                                                        <TooltipContent className="text-xs max-w-[150px] z-50">
                                                            {note}
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
