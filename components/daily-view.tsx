"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { Check, MessageSquare, ChevronLeft, ChevronRight, Pencil, Trash2, Flame, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toggleHabitCompletion, updateHabitNote, updateHabit, deleteHabit, createHabit } from "@/app/actions/habits";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { calculateStreak } from "@/utils/streak";

type Habit = {
    id: string;
    title: string;
    description?: string;
    color: string;
};

type HabitLog = {
    habit_id: string;
    completed_at: string; // YYYY-MM-DD
    notes?: string;
};

interface DailyViewProps {
    habits: Habit[];
    logs: HabitLog[];
    date?: Date;
    readOnly?: boolean;
}

export default function DailyView({ habits: initialHabits, logs, date = new Date(), readOnly = false }: DailyViewProps) {
    const [viewDate, setViewDate] = useState(date);
    const dateStr = format(viewDate, "yyyy-MM-dd");
    const router = useRouter();

    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived completed set based on logs for the current viewDate
    const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());

    useEffect(() => {
        const currentDayLogs = logs.filter(l => l.completed_at === format(viewDate, "yyyy-MM-dd"));
        setCompletedHabits(new Set(currentDayLogs.map(l => l.habit_id)));
    }, [viewDate, logs]);

    // Navigation Handlers
    const prevDay = () => setViewDate(subDays(viewDate, 1));
    const nextDay = () => setViewDate(addDays(viewDate, 1));
    const goToday = () => setViewDate(new Date());

    // Helper to find log for a habit today
    const getLog = (habitId: string) => logs.find(l => l.habit_id === habitId && l.completed_at === dateStr);

    const handleToggle = async (habitId: string) => {
        // Optimistic
        const isCompleted = completedHabits.has(habitId);
        const newSet = new Set(completedHabits);
        if (isCompleted) {
            newSet.delete(habitId);
        } else {
            newSet.add(habitId);
        }
        setCompletedHabits(newSet);

        const dateStr = format(viewDate, "yyyy-MM-dd");
        const result = await toggleHabitCompletion(habitId, dateStr);
        if (result?.error) {
            setCompletedHabits(completedHabits); // Revert
            toast.error("Failed to update status");
        } else {
            router.refresh();
        }
    };

    const handleDelete = async (habitId: string) => {
        if (!confirm("Delete this habit?")) return;
        const result = await deleteHabit(habitId);
        if (result?.error) toast.error(result.error);
        else {
            toast.success("Deleted");
            router.refresh();
        }
    }

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
            router.refresh();
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border shrink-0">
                        <Button variant="ghost" size="icon" onClick={prevDay} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        <h2 className="text-sm sm:text-lg font-semibold text-foreground min-w-[140px] sm:min-w-[200px] text-center select-none uppercase tracking-wide">
                            {format(viewDate, "EEE, MMM do")}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={nextDay} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                    </div>

                    {!isSameDay(viewDate, new Date()) && (
                        <Button variant="outline" size="sm" onClick={goToday} className="h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                            Today
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="text-muted-foreground text-[10px] sm:text-sm font-medium bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                        {completedHabits.size} / {initialHabits.length} Completed
                    </div>

                    {!readOnly && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs sm:text-sm">
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

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {initialHabits.map(habit => {
                    const isCompleted = completedHabits.has(habit.id);
                    const log = getLog(habit.id);
                    const streak = calculateStreak(habit.id, logs);

                    return (
                        <div key={habit.id} className={cn(
                            "p-3 sm:p-4 rounded-xl border transition-all duration-300 flex flex-col gap-2 sm:gap-3 group relative overflow-hidden",
                            isCompleted
                                ? "bg-card border-border shadow-[0_0_15px_-5px_var(--color)]"
                                : "bg-card/50 border-border hover:border-foreground/20"
                        )}
                            style={{ "--color": habit.color } as any}
                        >
                            <div className="flex items-start justify-between gap-3 sm:gap-4 z-10">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                        <h3 className={cn("font-medium text-base sm:text-lg transition-colors truncate", isCompleted ? "text-foreground" : "text-foreground/80")}>
                                            {habit.title}
                                        </h3>
                                        {!readOnly && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingHabit(habit)} className="p-1 hover:text-indigo-500 text-muted-foreground"><Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                                                <button onClick={() => handleDelete(habit.id)} className="p-1 hover:text-destructive text-muted-foreground"><Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Streak Badge */}
                                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground font-medium">
                                        <Flame className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", streak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground")} />
                                        <span>{streak} Day Streak</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => !readOnly && handleToggle(habit.id)}
                                    disabled={readOnly}
                                    className={cn(
                                        "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 shadow-sm",
                                        isCompleted
                                            ? "bg-[var(--color)] border-[var(--color)] text-white scale-105"
                                            : "border-muted-foreground/30 text-transparent hover:border-[var(--color)] hover:scale-110",
                                        readOnly && "cursor-default hover:scale-100 opacity-80"
                                    )}
                                    style={{ borderColor: isCompleted ? habit.color : undefined, backgroundColor: isCompleted ? habit.color : undefined }}
                                >
                                    <Check className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                                </button>
                            </div>

                            {/* Notes Section - Dialog for better UX */}
                            <NoteDialog habit={habit} date={viewDate} initialNote={log?.notes} onSave={() => { router.refresh() }} readOnly={readOnly} />
                        </div>
                    );
                })}
                {initialHabits.length === 0 && (
                    <div className="col-span-full h-32 flex items-center justify-center border border-dashed border-border rounded-xl text-muted-foreground">
                        No habits for today.
                    </div>
                )}
            </div>
        </div>
    );
}

function NoteDialog({ habit, date, initialNote, onSave, readOnly = false }: { habit: Habit, date: Date, initialNote?: string, onSave: () => void, readOnly?: boolean }) {
    const [note, setNote] = useState(initialNote || "");
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync note state when initialNote changes (due to day switching)
    useEffect(() => {
        setNote(initialNote || "");
    }, [initialNote]);

    const handleSave = async () => {
        setIsSaving(true);
        const dateStr = format(date, "yyyy-MM-dd");
        const result = await updateHabitNote(habit.id, dateStr, note);
        setIsSaving(false);
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Note saved");
            setIsOpen(false);
            onSave();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="self-start mt-auto -ml-2 text-muted-foreground hover:text-foreground gap-2 h-8">
                    <MessageSquare className="w-4 h-4" />
                    {initialNote ? (readOnly ? "View Note" : "Edit Note") : (readOnly ? "No Note" : "Add Note")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Notes for {habit.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <Textarea
                        placeholder={readOnly ? "No note for today" : "How did it go today?"}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="min-h-[100px]"
                        readOnly={readOnly}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>{readOnly ? "Close" : "Cancel"}</Button>
                        {!readOnly && (
                            <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white hover:bg-indigo-700">
                                {isSaving ? "Saving..." : "Save Note"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
