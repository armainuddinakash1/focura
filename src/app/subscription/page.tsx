"use client";

import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const perks = ["Unlimited tasks", "Priority planning", "A calmer workflow"];

function SubscriptionPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubscription = async () => {
        setLoading(true);
        setError(null);

        try {
            const checkoutAttemptId = crypto.randomUUID();

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    checkoutAttemptId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to create checkout session",
                );
            }

            if (!data.url) {
                throw new Error("Checkout URL was not provided");
            }

            window.location.href = data.url;
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong please try again",
            );
        } finally {
            setLoading(false);
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
                    {error && (
                        <Alert variant="destructive" className="mt-10">
                            <AlertCircle className="size-4" />
                            <AlertTitle>Payment failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        className="mt-8 w-full sm:w-auto"
                        onClick={handleSubscription}
                        disabled={loading}
                    >
                        {loading ? "Working..." : "Upgrade now"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default SubscriptionPage;
