"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function RealtimeRefresher() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel('global-habit-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'habit_logs'
            }, () => {
                router.refresh();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'habits'
            }, () => {
                router.refresh();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [router]);

    return null;
}
