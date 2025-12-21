import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { User, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "./settings-form"; // Refactoring to client component
import Link from "next/link";
import { StatsCards } from "@/components/stats-cards";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Fetch Profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch Stats Data
    const { count: totalHabits } = await supabase
        .from("habits")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

    const { data: logs } = await supabase
        .from("habit_logs")
        .select("completed_at, habit_id")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

    const totalCompletions = logs?.length || 0;

    // Calculate Streak (Consecutive days with at least one completion)
    // Calculate Streak (Consecutive days with ALL habits completed)
    let currentStreak = 0;
    if (totalHabits && totalHabits > 0 && logs && logs.length > 0) {
        // Group logs by date
        const logsByDate = new Map<string, Set<string>>();
        logs.forEach(log => {
            if (!logsByDate.has(log.completed_at)) {
                logsByDate.set(log.completed_at, new Set());
            }
            logsByDate.get(log.completed_at)?.add(log.habit_id); // Ensure unique habit_id per day just in case
        });

        const today = new Date();
        const datesToCheck = [];

        // Check if streak is active today (all completed today)

        // Check if streak is active today (all completed today)
        // Or if valid from yesterday (all completed yesterday)
        // If today is NOT perfect, check yesterday. If yesterday is perfect, streak starts there.
        // If today IS perfect, streak includes today.

        const isPerfectDay = (dateStr: string) => {
            const completedCount = logsByDate.get(dateStr)?.size || 0;
            return completedCount === totalHabits;
        };

        // Robust Timezone Check:
        // Client time might be ahead of server UTC (e.g., UTC+5:30).
        // Server "Today" might be Client "Yesterday". 
        // Server "Tomorrow" might be Client "Today".
        // We check a 3-day window centered on UTC Today to find the most recent perfect day to start the streak.

        const todayStr = today.toISOString().split('T')[0];

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let startStreakDate: Date | null = null;

        // Check from future to past to find the "latest" active streak day
        if (isPerfectDay(tomorrowStr)) {
            startStreakDate = tomorrow;
        } else if (isPerfectDay(todayStr)) {
            startStreakDate = today;
        } else if (isPerfectDay(yesterdayStr)) {
            startStreakDate = yesterday;
        }

        if (startStreakDate) {
            let checkDate = startStreakDate;
            while (true) {
                const checkDateStr = checkDate.toISOString().split('T')[0];
                if (isPerfectDay(checkDateStr)) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }
    }

    return (
        <div className="w-full mx-auto py-10 sm:py-16 px-4 sm:px-8 space-y-12 max-w-7xl">
            <div>
                <Link href="/dashboard" className="inline-block mb-4">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-foreground text-muted-foreground gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
                        <p className="text-muted-foreground">Manage your account and view your progress.</p>
                    </div>
                </div>
            </div>

            <StatsCards
                totalHabits={totalHabits || 0}
                totalCompletions={totalCompletions}
                currentStreak={currentStreak}
            />

            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" />
                        <CardTitle>Profile Information</CardTitle>
                    </div>
                    <CardDescription>Update your public profile details.</CardDescription>
                </CardHeader>
                <SettingsForm
                    key={profile?.updated_at || 'initial'}
                    userEmail={user.email}
                    initialFullName={profile?.full_name || ""}
                    initialAvatarUrl={profile?.avatar_url}
                />
            </Card>
        </div>
    );
}
