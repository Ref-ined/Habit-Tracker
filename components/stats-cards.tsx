import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Flame, Trophy } from "lucide-react";

interface StatsCardsProps {
    totalHabits: number;
    totalCompletions: number;
    currentStreak: number;
}

export function StatsCards({ totalHabits, totalCompletions, currentStreak }: StatsCardsProps) {
    return (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Habits</CardTitle>
                    <Activity className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{totalHabits}</div>
                    <p className="text-xs text-muted-foreground">Active habits being tracked</p>
                </CardContent>
            </Card>
            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Completions</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{totalCompletions}</div>
                    <p className="text-xs text-muted-foreground">Lifetime check-ins</p>
                </CardContent>
            </Card>
            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
                    <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
                    <p className="text-xs text-muted-foreground">Days since last missed habit</p>
                    {/* Note: "Streak" logic is complex. 
                        Is it "Any habit completed today"? Or "All habits completed"?
                        Usually "Any habit" or a specific "Global Streak" of usage.
                        Lets define it as: Consecutive days with at least one completion.
                    */}
                </CardContent>
            </Card>
        </div>
    );
}
