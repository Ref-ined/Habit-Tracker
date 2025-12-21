"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getOrCreateFriendCode } from "@/app/actions/user";

export function ShareDialog() {
    const [friendCode, setFriendCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCode = async () => {
            const result = await getOrCreateFriendCode();
            if (result.success && result.code) {
                setFriendCode(result.code);
            } else if (result.error) {
                toast.error("Could not load sharing link");
            }
            setIsLoading(false);
        }
        fetchCode();
    }, []);

    const shareUrl = typeof window !== 'undefined' && friendCode
        ? `${window.location.origin}/share/${friendCode}`
        : '';

    const copyToClipboard = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card hover:bg-muted border-border text-foreground">
                    <Share2 className="w-4 h-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>Share your Progress</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Send this link to friends so they can view your habits (Read Only).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating unique link...</span>
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="link" className="text-muted-foreground">Public Link</Label>
                                <Input
                                    id="link"
                                    value={shareUrl}
                                    readOnly
                                    className="bg-muted/30 border-border focus-visible:ring-indigo-500"
                                />
                            </div>
                            <Button onClick={copyToClipboard} size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                        Anyone with this link can view your habits, but they cannot edit or delete anything.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
