import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, User, LogOut } from "lucide-react";
import Link from "next/link";
import HabitGrid from "@/components/habit-grid";
import DailyView from "@/components/daily-view";
import WeeklyView from "@/components/weekly-view";
import YearlyView from "@/components/yearly-view";
import { ShareDialog } from "@/components/share-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { AIInsights } from "@/components/ai-insights";
import { signOut } from "@/app/actions/auth";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch Habits
    const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    // Fetch Logs
    const { data: logs } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", user.id);

    // Consistent time for all views to prevent hydration mismatch
    const now = new Date();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300 w-full overflow-x-hidden relative">
            <RealtimeRefresher />
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
                <div className="w-full px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                        <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                        <span className="font-bold text-base sm:text-lg">Habit<span className="text-indigo-500">Track</span></span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                        <ModeToggle />
                        <ShareDialog />
                        <Link href="/dashboard/settings">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full w-8 h-8 sm:w-10 sm:h-10 overflow-hidden border border-border p-0">
                                {profile?.avatar_url ? (
                                    <div className="text-lg sm:text-xl leading-none flex items-center justify-center w-full h-full bg-muted">
                                        {profile.avatar_url}
                                    </div>
                                ) : (
                                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                )}
                            </Button>
                        </Link>
                        <form action={signOut}>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive rounded-full w-8 h-8 sm:w-10 sm:h-10" title="Sign Out">
                                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full px-4 sm:px-8 py-4 sm:py-6">
                <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="space-y-4">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 sm:mb-4">My Habits</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Manage your daily activities and track your consistency.</p>
                    </div>

                    <AIInsights
                        habits={habits || []}
                        logs={logs || []}
                    />

                    <Tabs defaultValue="monthly" className="w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 overflow-x-auto no-scrollbar pb-1">
                            <TabsList className="bg-muted border border-border w-full sm:w-auto flex justify-start sm:justify-center h-auto p-1 overflow-x-auto no-scrollbar">
                                <TabsTrigger value="daily" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Daily</TabsTrigger>
                                <TabsTrigger value="weekly" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Weekly</TabsTrigger>
                                <TabsTrigger value="monthly" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Monthly</TabsTrigger>
                                <TabsTrigger value="yearly" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Yearly</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="daily">
                            <DailyView
                                habits={habits || []}
                                logs={logs || []}
                                date={now}
                            />
                        </TabsContent>

                        <TabsContent value="weekly">
                            <WeeklyView
                                habits={habits || []}
                                logs={logs || []}
                                currentDate={now}
                            />
                        </TabsContent>

                        <TabsContent value="monthly" className="space-y-4">
                            {/* Habit Grid Component */}
                            <HabitGrid
                                initialHabits={habits || []}
                                initialLogs={logs || []}
                                currentDate={now}
                            />
                        </TabsContent>

                        <TabsContent value="yearly">
                            <YearlyView logs={logs || []} habits={habits || []} />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
