"use client";

import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/context/SubscriptionContext";

const perks = ["Unlimited tasks", "Priority planning", "A calmer workflow"];

function SubscriptionPage() {
    const { isSubscribed, isLoading, refreshSubscription } = useSubscription();
    const [actionLoading, setActionLoading] = useState(false);

    const loading = isLoading || actionLoading;

    const handleSubscription = async () => {
        const newSubscriptionState = !isSubscribed;

        try {
            setActionLoading(true);

            const response = await fetch("/api/subscription", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isSubscribed: newSubscriptionState }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update subscription");
            }

            await refreshSubscription();
        } catch (error) {
            console.error("Subscription error:", error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <Card className="overflow-hidden border-border/80 bg-card/80">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                                Focura Plus
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                {loading
                                    ? "Loading..."
                                    : isSubscribed
                                      ? "Premium plan active"
                                      : "Upgrade for more focus"}
                            </h1>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Sparkles className="h-5 w-5" />
                        </div>
                    </div>

                    <p className="mt-4 max-w-xl text-base text-muted-foreground">
                        Power through a bigger backlog and keep every task in
                        view without the friction.
                    </p>

                    <div className="mt-6 space-y-3">
                        {perks.map((perk) => (
                            <div
                                key={perk}
                                className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                                {perk}
                            </div>
                        ))}
                    </div>

                    <Button
                        className="mt-8 w-full sm:w-auto"
                        onClick={handleSubscription}
                        disabled={loading}
                    >
                        {loading
                            ? "Working..."
                            : isSubscribed
                              ? "Switch to free plan"
                              : "Upgrade now"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default SubscriptionPage;
