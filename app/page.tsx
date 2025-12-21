"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { login, signup } from "@/app/actions/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ModeToggle } from "@/components/mode-toggle";

// Validation Schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});


export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login Form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Signup Form
  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // If successful, the server action will redirect.
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("password", values.password);

    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // If successful, the server action will redirect.
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-50" />

      {/* Mode Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>

      {/* Left Panel - Hero / content */}
      <div className="flex-1 flex flex-col justify-center items-center p-12 lg:p-16 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xl space-y-10 sm:space-y-12 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Consistency</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground">
            Build habits that <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">stick.</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Track your daily progress based on the attendance grid system.
            Visualize your consistency, get AI insights, and achieve your goals.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-center lg:justify-start pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Free forever tier</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>No credit card required</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex justify-center items-center p-4 lg:p-16 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="border-border bg-card/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-foreground">Welcome back</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 pt-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField control={loginForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="m@example.com" {...field} className="bg-background border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={loginForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="bg-background border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {error && <div className="text-destructive text-sm font-medium">{error}</div>}
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" type="submit" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                        {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 pt-4">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                      <FormField control={signupForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="bg-background border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={signupForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="m@example.com" {...field} className="bg-background border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={signupForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="bg-background border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {error && <div className="text-destructive text-sm font-medium">{error}</div>}
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" type="submit" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border/50 pt-6">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
