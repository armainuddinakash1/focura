"use client";

import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const featureCards = [
    {
        title: "Clear priorities",
        description:
            "Capture ideas, define your next action, and focus on the work that moves the needle.",
        icon: CheckCircle2,
    },
    {
        title: "Fast workflows",
        description:
            "A frictionless task experience keeps you moving without extra ceremony or clutter.",
        icon: Zap,
    },
    {
        title: "Private by default",
        description:
            "Built with secure account flows and a calm interface designed for consistent momentum.",
        icon: ShieldCheck,
    },
];

export default function Home() {
    const { isLoaded, userId } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && userId) {
            router.push("/dashboard");
        }
    }, [isLoaded, userId, router]);

    if (!isLoaded) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading Focura…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Built for focus and momentum
                    </div>
                    <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                        Focus on what
                        <span className="block text-primary">
                            matters most.
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
                        Focura helps you organize life’s important tasks with a
                        calm, productive workspace built to reduce overwhelm and
                        help you move forward.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link href="/sign-up">
                            <Button size="lg">Start free</Button>
                        </Link>
                        <Link href="/sign-in">
                            <Button variant="outline" size="lg">
                                Sign in
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mt-16 grid gap-6 md:grid-cols-3">
                    {featureCards.map(({ title, description, icon: Icon }) => (
                        <Card
                            key={title}
                            className="h-full border-border/80 bg-card/70 backdrop-blur-sm"
                        >
                            <CardContent className="flex h-full flex-col gap-4 p-6">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">
                                        {title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
