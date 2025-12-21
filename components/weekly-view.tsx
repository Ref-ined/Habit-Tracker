"use client";

import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay, subWeeks, addWeeks, isSameWeek } from "date-fns";
import { Check, ChevronLeft, ChevronRight, Flame, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toggleHabitCompletion, deleteHabit, updateHabit, createHabit } from "@/app/actions/habits";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateStreak } from "@/utils/streak";

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

interface WeeklyViewProps {
    habits: Habit[];
    logs: HabitLog[];
    currentDate?: Date;
    readOnly?: boolean;
}

export default function WeeklyView({ habits: initialHabits, logs: initialLogs, currentDate = new Date(), readOnly = false }: WeeklyViewProps) {
    const [viewDate, setViewDate] = useState(currentDate);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [localLogs, setLocalLogs] = useState<Set<string>>(new Set(initialLogs.map(l => `${l.habit_id}-${l.completed_at}`)));

    // Sync props to state (useful if data changes on server)
    const logsKey = initialLogs.map(l => `${l.habit_id}-${l.completed_at}`).sort().join(',');
    const currentLogsKey = Array.from(localLogs).sort().join(',');

    if (logsKey !== currentLogsKey) {
        // Direct state update in render is allowed if it's based on props
        setLocalLogs(new Set(initialLogs.map(l => `${l.habit_id}-${l.completed_at}`)));
    }

    // Navigation Handlers
    const prevWeek = () => setViewDate(subWeeks(viewDate, 1));
    const nextWeek = () => setViewDate(addWeeks(viewDate, 1));
    const goToday = () => setViewDate(new Date());

    const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handleToggle = async (habitId: string, day: Date) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const key = `${habitId}-${dateStr}`;

        const isCompleted = localLogs.has(key);
        const newLogs = new Set(localLogs);
        if (isCompleted) {
            newLogs.delete(key);
        } else {
            newLogs.add(key);
        }
        setLocalLogs(newLogs);

        const result = await toggleHabitCompletion(habitId, dateStr);
        if (result?.error) {
            setLocalLogs(localLogs); // Revert
            toast.error("Failed to update habit");
        } else {
            router.refresh();
        }
    };

    const handleDelete = async (habitId: string) => {
        if (!confirm("Are you sure you want to delete this habit?")) return;

        const result = await deleteHabit(habitId);
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Habit deleted");
            router.refresh();
        }
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

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const result = await createHabit(formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Habit created");
            // Close dialog would be nice, but simple router.refresh() for now
            router.refresh();
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-8 sm:space-y-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border shrink-0">
                        <Button variant="ghost" size="icon" onClick={prevWeek} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        <h2 className="text-sm sm:text-lg font-bold text-foreground min-w-[140px] sm:min-w-[200px] text-center select-none">
                            Week {format(weekStart, "w")} of {format(weekStart, "yyyy")}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={nextWeek} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                    </div>

                    {!isSameWeek(viewDate, new Date(), { weekStartsOn: 1 }) && (
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

            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-fit sm:w-full">
                        {/* Header */}
                        <div className="grid grid-cols-[140px_repeat(7,50px)] sm:grid-cols-[200px_repeat(7,1fr)] border-b border-border h-10 sm:h-12">
                            <div className="sticky left-0 z-20 bg-card px-3 sm:px-4 text-[10px] sm:text-sm font-medium text-muted-foreground flex items-center border-r border-border">Habit</div>
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className={cn(
                                    "flex flex-col items-center justify-center border-l border-border/50 bg-muted/30",
                                    isSameDay(day, new Date()) && "bg-indigo-500/10"
                                )}>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase leading-none mb-1">{format(day, "EEE")}</span>
                                    <span className={cn(
                                        "text-sm sm:text-base font-bold",
                                        isSameDay(day, new Date()) ? "text-indigo-500" : "text-foreground"
                                    )}>{format(day, "d")}</span>
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        {initialHabits.map(habit => {
                            const streak = calculateStreak(habit.id, initialLogs);

                            return (
                                <div key={habit.id} className="grid grid-cols-[140px_repeat(7,50px)] sm:grid-cols-[200px_repeat(7,1fr)] border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group h-10 sm:h-12 text-foreground">
                                    {/* Habit Info Column */}
                                    <div className="sticky left-0 z-20 bg-card px-3 sm:px-4 flex items-center justify-between border-r border-border gap-1 sm:gap-2 overflow-hidden h-full">
                                        <div className="flex items-center gap-2 sm:gap-3 truncate min-w-0">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                                            <span className="text-[13px] sm:text-[15px] font-medium text-foreground truncate" title={habit.title}>{habit.title}</span>
                                        </div>

                                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                            {/* Streak */}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn("flex items-center gap-0.5 text-[9px] sm:text-xs font-semibold cursor-help select-none mr-0.5 sm:mr-1", streak > 0 ? "text-orange-500" : "text-muted-foreground/50")}>
                                                        <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill={streak > 0 ? "currentColor" : "none"} />
                                                        <span>{streak}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-[10px] sm:text-xs">Streak: {streak} days</TooltipContent>
                                            </Tooltip>

                                            {/* Actions */}
                                            {!readOnly && (
                                                <>
                                                    <button onClick={() => setEditingHabit(habit)} className="text-muted-foreground hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                                                        <Pencil className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(habit.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                                                        <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Days Columns */}
                                    {weekDays.map(day => {
                                        const dateStr = format(day, "yyyy-MM-dd");
                                        const log = initialLogs.find(l => l.habit_id === habit.id && l.completed_at === dateStr);
                                        const isCompleted = !!log;
                                        const note = log?.notes;

                                        return (
                                            <div key={day.toISOString()} className="border-l border-border/50 flex items-center justify-center relative">
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
                                                            <Check className={cn("w-4 h-4 sm:w-5 sm:h-5", isCompleted ? "opacity-100" : "opacity-0")} strokeWidth={3} />
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
                            );
                        })}
                    </div>
                </div>

                {initialHabits.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No habits to display. Create one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
