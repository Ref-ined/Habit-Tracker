"use client";

import { updateProfile } from "@/app/actions/user";
import { updateEmail, updatePassword, signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { AvatarPicker } from "@/components/avatar-picker";
import { KeyRound, Mail, LogOut, User as UserIcon } from "lucide-react";

interface SettingsFormProps {
    userEmail?: string;
    initialFullName: string;
    initialAvatarUrl?: string;
}

export function SettingsForm({ userEmail, initialFullName, initialAvatarUrl }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatar, setAvatar] = useState(initialAvatarUrl || "🦁");

    // Security states
    const [newEmail, setNewEmail] = useState(userEmail || "");
    const [newPassword, setNewPassword] = useState("");

    async function handleProfileSubmit(formData: FormData) {
        setIsLoading(true);
        const result = await updateProfile(formData);
        setIsLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Profile updated successfully");
        }
    }

    async function handleEmailUpdate() {
        if (!newEmail || newEmail === userEmail) return;
        setIsLoading(true);
        const result = await updateEmail(newEmail);
        setIsLoading(false);
        if (result?.error) toast.error(result.error);
        else toast.success("Confirmation email sent to new address!");
    }

    async function handlePasswordUpdate() {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setIsLoading(true);
        const result = await updatePassword(newPassword);
        setIsLoading(false);
        if (result?.error) toast.error(result.error);
        else {
            toast.success("Password updated successfully!");
            setNewPassword("");
        }
    }

    return (
        <div className="space-y-8">
            {/* Profile Section */}
            <form action={handleProfileSubmit} className="space-y-6">
                <CardContent className="space-y-6 p-6">
                    <div className="space-y-4">
                        <Label className="text-base flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-indigo-500" />
                            Profile Details
                        </Label>
                        <div className="bg-muted/30 p-6 rounded-xl border border-border space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-5xl border-2 border-indigo-500/50 shadow-inner">
                                    {avatar}
                                </div>
                                <div className="flex-1 space-y-1 text-center sm:text-left">
                                    <h4 className="font-semibold text-lg">Your Avatar</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        This spirit animal will represent you across the app.
                                    </p>
                                    <AvatarPicker value={avatar} onChange={setAvatar} />
                                    <input type="hidden" name="avatarUrl" value={avatar} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    defaultValue={initialFullName}
                                    placeholder="John Doe"
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end p-6 pt-0">
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                        {isLoading ? "Saving Profile..." : "Save Profile Changes"}
                    </Button>
                </CardFooter>
            </form>

            <div className="h-px bg-border my-8" />

            {/* Security Section */}
            <div className="space-y-6 p-6 pt-0">
                <Label className="text-base flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-500" />
                    Security Settings
                </Label>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Email Card */}
                    <div className="bg-muted/30 p-6 rounded-xl border border-border space-y-4 flex flex-col">
                        <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                Email Address
                            </h4>
                            <p className="text-xs text-muted-foreground">Update your login email (requires confirmation).</p>
                        </div>
                        <Input
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="bg-background border-border"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEmailUpdate}
                            disabled={isLoading || newEmail === userEmail}
                            className="w-full mt-auto"
                        >
                            Update Email
                        </Button>
                    </div>

                    {/* Password Card */}
                    <div className="bg-muted/30 p-6 rounded-xl border border-border space-y-4 flex flex-col">
                        <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-muted-foreground" />
                                Change Password
                            </h4>
                            <p className="text-xs text-muted-foreground">Set a new strong password for your account.</p>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-background border-border"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePasswordUpdate}
                            disabled={isLoading || !newPassword}
                            className="w-full mt-auto"
                        >
                            Change Password
                        </Button>
                    </div>
                </div>
            </div>

            <div className="h-px bg-border my-8" />

            {/* Danger Zone */}
            <div className="space-y-6 flex flex-col items-center sm:items-start p-6 pt-0">
                <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-semibold text-destructive">Account Session</h4>
                    <p className="text-sm text-muted-foreground">Log out from your current session.</p>
                </div>
                <Button
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-colors gap-2"
                    onClick={() => signOut()}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
