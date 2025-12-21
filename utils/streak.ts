import { differenceInDays, parseISO, subDays, startOfDay, format } from "date-fns";

type SimpleLog = {
    habit_id: string;
    completed_at: string; // YYYY-MM-DD
};

/**
 * Calculates the current streak for a habit based on logs.
 * Checks if the habit was completed today or yesterday to maintain the streak.
 */
export function calculateStreak(habitId: string, logs: SimpleLog[]): number {
    const habitLogs = logs
        .filter(l => l.habit_id === habitId)
        .map(l => l.completed_at)
        .sort((a, b) => b.localeCompare(a)); // Newest first

    if (habitLogs.length === 0) return 0;

    const logSet = new Set(habitLogs);
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");

    // Check if streak is active (completed today or yesterday)
    let currentCheckDate = today;

    // If not completed today, check yesterday. 
    // If neither, streak is broken (0), UNLESS the last log was yesterday?
    // Actually, "Current Streak" usually means "Consecutive days ending today (if done) or yesterday".
    // If I didn't do it today yet, streak is still alive if I did it yesterday.

    if (!logSet.has(todayStr)) {
        if (!logSet.has(yesterdayStr)) {
            return 0; // Streak broken
        }
        currentCheckDate = subDays(today, 1);
    }

    let streak = 0;
    // Iterate backwards
    while (true) {
        const dateStr = format(currentCheckDate, "yyyy-MM-dd");
        if (logSet.has(dateStr)) {
            streak++;
            currentCheckDate = subDays(currentCheckDate, 1);
        } else {
            break;
        }
    }

    return streak;
}
