import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import HabitGrid from "@/components/habit-grid";
import DailyView from "@/components/daily-view";
import WeeklyView from "@/components/weekly-view";
import YearlyView from "@/components/yearly-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export default async function SharedHabitPage({ params }: { params: Promise<{ code: string }> }) {
    const code = (await params).code;
    const supabase = await createClient();

    // Call the secure RPC function
    const { data: habitsAndLogs, error } = await supabase
        .rpc('get_shared_habits', { code });

    if (error || !habitsAndLogs || habitsAndLogs.length === 0) {
        if (error) console.error("Share error:", JSON.stringify(error, null, 2));
        return notFound();
    }

    // Transform data
    const habits = habitsAndLogs.map((h: any) => ({
        id: h.id,
        title: h.title,
        color: h.color
    }));

    const logs = habitsAndLogs.flatMap((h: any) =>
        h.logs.map((l: any) => ({
            habit_id: h.id,
            completed_at: l.completed_at,
            notes: l.notes
        }))
    );

    const now = new Date();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
            <RealtimeRefresher />

            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
                <div className="w-full px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                        <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                        <span className="font-bold text-base sm:text-lg">Habit<span className="text-indigo-500">Track</span></span>
                        <div className="ml-2 px-2 py-0.5 rounded-full bg-muted text-[10px] sm:text-xs text-muted-foreground border border-border">
                            Shared View
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <ModeToggle />
                        <Link href="/">
                            <Button variant="outline" size="sm" className="hidden sm:flex border-border">Create My Own</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full px-4 sm:px-8 py-8 sm:py-12">
                <div className="flex flex-col gap-8 sm:gap-12">
                    <div className="space-y-4">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 sm:mb-4">Shared Habits</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Viewing professional consistency and progress.</p>
                    </div>

                    <Tabs defaultValue="monthly" className="w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-10 overflow-x-auto no-scrollbar pb-1">
                            <TabsList className="bg-muted border border-border w-full sm:w-auto flex justify-start sm:justify-center h-auto p-1 overflow-x-auto no-scrollbar">
                                <TabsTrigger value="daily" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Daily</TabsTrigger>
                                <TabsTrigger value="weekly" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Weekly</TabsTrigger>
                                <TabsTrigger value="monthly" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Monthly</TabsTrigger>
                                <TabsTrigger value="yearly" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Yearly</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="daily">
                            <DailyView
                                habits={habits}
                                logs={logs}
                                date={now}
                                readOnly={true}
                            />
                        </TabsContent>

                        <TabsContent value="weekly">
                            <WeeklyView
                                habits={habits}
                                logs={logs}
                                currentDate={now}
                                readOnly={true}
                            />
                        </TabsContent>

                        <TabsContent value="monthly">
                            <HabitGrid
                                initialHabits={habits}
                                initialLogs={logs}
                                currentDate={now}
                                readOnly={true}
                            />
                        </TabsContent>

                        <TabsContent value="yearly">
                            <YearlyView
                                logs={logs}
                                habits={habits}
                                readOnly={true}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
