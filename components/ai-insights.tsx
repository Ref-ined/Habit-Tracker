"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, AlertCircle, Zap, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, isWeekend, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface Habit {
    id: string;
    title: string;
    color: string;
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HabitLog {
    habit_id: string;
    completed_at: string;
}

interface AIInsightsProps {
    habits: Habit[];
    logs: HabitLog[];
}

interface Insight {
    type: 'positive' | 'warning' | 'info';
    icon: any;
    title: string;
    description: string;
}

export function AIInsights({ habits, logs }: AIInsightsProps) {
    const [insights, setInsights] = useState<Insight[]>([]);

    useEffect(() => {
        if (habits.length === 0) return;

        const newInsights: Insight[] = [];

        // 1. Analyze Core Consistency
        const habitStats = habits.map(habit => {
            const habitLogs = logs.filter(l => l.habit_id === habit.id);

            // Calculate current streak
            let streak = 0;
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const date = format(subDays(today, i), "yyyy-MM-dd");
                if (habitLogs.some(l => l.completed_at === date)) {
                    streak++;
                } else {
                    if (i === 0) continue; // Allow missing today if it's early
                    break;
                }
            }

            return { ...habit, logs: habitLogs, streak };
        });

        // Consistency King
        const topHabit = [...habitStats].sort((a, b) => b.streak - a.streak)[0];
        if (topHabit && topHabit.streak >= 3) {
            newInsights.push({
                type: 'positive',
                icon: TrendingUp,
                title: `${topHabit.title} is on fire!`,
                description: `You've maintained a ${topHabit.streak} day streak. You're becoming a pro at this!`
            });
        }

        // Weekend/Weekday Patterns
        habitStats.forEach(habit => {
            const weekendLogs = habit.logs.filter(l => isWeekend(parseISO(l.completed_at)));
            const weekdayLogs = habit.logs.filter(l => !isWeekend(parseISO(l.completed_at)));

            if (weekendLogs.length > weekdayLogs.length * 2 && weekdayLogs.length > 0) {
                if (!newInsights.find(i => i.title.includes("Weekend Warrior"))) {
                    newInsights.push({
                        type: 'info',
                        icon: Calendar,
                        title: `Weekend Warrior: ${habit.title}`,
                        description: `You're much more active with this on weekends. Try setting a weekday alarm to stay consistent!`
                    });
                }
            } else if (weekdayLogs.length > weekendLogs.length * 2 && weekendLogs.length === 0 && weekdayLogs.length > 3) {
                if (!newInsights.find(i => i.title.includes("Don't let weekends break"))) {
                    newInsights.push({
                        type: 'warning',
                        icon: AlertCircle,
                        title: `Don't let weekends break ${habit.title}`,
                        description: `You're consistent on workdays, but missing weekends. Try a smaller version of this habit on Sundays.`
                    });
                }
            }
        });

        // Global Activity Check
        const totalCompletionsLast3Days = logs.filter(l =>
            differenceInDays(new Date(), parseISO(l.completed_at)) <= 3
        ).length;

        if (totalCompletionsLast3Days === 0 && habits.length > 0) {
            newInsights.push({
                type: 'warning',
                icon: Zap,
                title: "Time to reconnect?",
                description: "You haven't logged any habits for a few days. Even 1 minute counts—start small today!"
            });
        }

        // General Encouragement
        if (newInsights.length < 2) {
            newInsights.push({
                type: 'info',
                icon: Sparkles,
                title: "Consistency is key",
                description: "The best way to build a habit is to never miss two days in a row. You're doing great!"
            });
        }

        setInsights(newInsights.slice(0, 2));
    }, [habits, logs]);

    function differenceInDays(d1: Date, d2: Date) {
        return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (insights.length === 0) return null;

    return (
        <div className="select-none">
            {/* Desktop View: Inline */}
            <div className="hidden sm:block space-y-2">
                <div className="flex items-center gap-2 px-1 opacity-70">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Insights</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                >
                    <AnimatePresence mode="popLayout">
                        {insights.map((insight, idx) => (
                            <InsightCard key={idx} insight={insight} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Mobile View: Collapsed behind a button */}
            <div className="sm:hidden flex justify-end">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-indigo-500/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 gap-2 h-8 px-3 rounded-full hover:bg-indigo-500/10 transition-all">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span className="text-xs font-bold">View AI Insights</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                AI Insights
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 pt-4">
                            {insights.map((insight, idx) => (
                                <InsightCard key={idx} insight={insight} isMobile />
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

function InsightCard({ insight, isMobile = false }: { insight: Insight; isMobile?: boolean }) {
    return (
        <Card className="bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20 backdrop-blur-sm relative overflow-hidden group">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors" />

            <CardContent className="p-3 flex gap-3 items-center relative z-10">
                <div className={`p-2 rounded-lg shrink-0 ${insight.type === 'positive' ? 'bg-green-500/10 text-green-500' :
                    insight.type === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-indigo-500/10 text-indigo-500'
                    }`}>
                    <insight.icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                    <h4 className="text-[13px] font-bold text-foreground/90 truncate">{insight.title}</h4>
                    <p className={cn(
                        "text-[11px] text-muted-foreground leading-tight",
                        !isMobile && "line-clamp-1"
                    )}>
                        {insight.description}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
