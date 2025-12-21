"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AVATARS = [
    "🦁", "🐯", "🐻", "🐨", "🐼", "🦊",
    "🐰", "🐹", "🐭", "🐱", "🐶", "🐺",
    "🐸", "🦄", "🐲", "🦕", "🐙", "🦋"
];

interface AvatarPickerProps {
    value?: string;
    onChange: (avatar: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
    return (
        <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((avatar) => (
                <Button
                    key={avatar}
                    type="button"
                    variant="ghost"
                    className={cn(
                        "h-12 w-12 text-2xl flex items-center justify-center rounded-full transition-all",
                        value === avatar
                            ? "bg-indigo-600/20 ring-2 ring-indigo-500 scale-110"
                            : "hover:bg-muted"
                    )}
                    onClick={() => onChange(avatar)}
                >
                    {avatar}
                </Button>
            ))}
        </div>
    );
}
