"use client";

import { Check, Sparkles, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubscription } from "@/context/SubscriptionContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";

const perks = ["Unlimited tasks", "Priority planning", "A calmer workflow"];

function SubscriptionPage() {
    const {
        hasPremiumAccess,
        subscriptionStatus,
        subscriptionEnd,
        subscriptionMessage,
        isLoading: subscriptionLoading,
        refreshSubscription,
    } = useSubscription();

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /*
     * Refresh subscription when the user returns from Stripe Checkout.
     *
     * The webhook should update the database first, then this request
     * reads the latest subscription state from your database.
     */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const checkout = params.get("checkout");

        if (checkout === "success") {
            void refreshSubscription();

            // Remove the checkout query parameter from the URL.
            window.history.replaceState({}, "", window.location.pathname);
        }

        if (checkout === "canceled") {
            setError("Checkout was canceled.");

            // Remove the checkout query parameter from the URL.
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [refreshSubscription]);

    const handleSubscription = async () => {
        if (hasPremiumAccess || checkoutLoading) {
            return;
        }

        setCheckoutLoading(true);
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
                    : "Something went wrong. Please try again.",
            );

            setCheckoutLoading(false);
        }
    };

    const loading = subscriptionLoading || checkoutLoading;

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
                                    : hasPremiumAccess
                                      ? "You're already subscribed"
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

                    {hasPremiumAccess && (
                        <Alert className="mt-8">
                            <Sparkles className="size-4" />

                            <AlertTitle>
                                {subscriptionStatus === "TRIALING"
                                    ? "Your free trial is active"
                                    : "Your subscription is active"}
                            </AlertTitle>

                            <AlertDescription>
                                {subscriptionMessage}

                                {subscriptionEnd && (
                                    <span className="mt-1 block">
                                        Subscription end:{" "}
                                        {new Date(
                                            subscriptionEnd,
                                        ).toLocaleDateString()}
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {!hasPremiumAccess &&
                        subscriptionStatus !== null &&
                        subscriptionStatus !== "ACTIVE" &&
                        subscriptionStatus !== "TRIALING" && (
                            <Alert variant="destructive" className="mt-8">
                                <AlertCircle className="size-4" />

                                <AlertTitle>Subscription status</AlertTitle>

                                <AlertDescription>
                                    {subscriptionMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                    {error && (
                        <Alert variant="destructive" className="mt-8">
                            <AlertCircle className="size-4" />

                            <AlertTitle>Checkout error</AlertTitle>

                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!hasPremiumAccess && subscriptionStatus === null && (
                        <>
                            <AspectRatio ratio={1 / 1}>
                                <Image
                                    src="/test_payment.png"
                                    alt="Test payment instructions"
                                    className="rounded-md object-cover"
                                    width={1254}
                                    height={1254}
                                />
                            </AspectRatio>
                            <Button
                                className="mt-8 w-full sm:w-auto"
                                onClick={handleSubscription}
                                disabled={loading}
                            >
                                {checkoutLoading
                                    ? "Redirecting..."
                                    : "Upgrade now"}
                            </Button>
                        </>
                    )}

                    {hasPremiumAccess && (
                        <p className="mt-8 text-sm text-muted-foreground">
                            You already have access to Focura Plus.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default SubscriptionPage;
