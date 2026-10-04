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

type User = {
    stripeCustomerId: string | null;
};

function SubscriptionPage() {
    const {
        hasPremiumAccess,
        subscriptionStatus,
        subscriptionEnd,
        subscriptionMessage,
        isLoading: subscriptionLoading,
        refreshSubscription,
    } = useSubscription();

    const [user, setUser] = useState<User | null>(null);
    const [userLoading, setUserLoading] = useState(true);

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /*
     * Fetch the local user so we can determine whether a
     * Stripe Customer already exists.
     */
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("/api/user");

                if (!response.ok) {
                    throw new Error("Failed to fetch user");
                }

                const data = await response.json();

                setUser(data.user);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load user information.",
                );
            } finally {
                setUserLoading(false);
            }
        };

        void fetchUser();
    }, []);

    /*
     * Refresh subscription when the user returns from Stripe Checkout.
     */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const checkout = params.get("checkout");

        if (checkout === "success") {
            void refreshSubscription();

            window.history.replaceState({}, "", window.location.pathname);
        }

        if (checkout === "canceled") {
            setError("Checkout was canceled.");

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

    const handleManageSubscription = async () => {
        if (!user?.stripeCustomerId || portalLoading) {
            return;
        }

        setPortalLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/stripe/portal", {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to open subscription management",
                );
            }

            if (!data.url) {
                throw new Error("Customer Portal URL was not provided");
            }

            window.location.href = data.url;
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again.",
            );

            setPortalLoading(false);
        }
    };

    const loading =
        subscriptionLoading || userLoading || checkoutLoading || portalLoading;

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

                            <AlertTitle>Something went wrong</AlertTitle>

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

                    {hasPremiumAccess && user?.stripeCustomerId && (
                        <Button
                            className="mt-8 w-full sm:w-auto"
                            onClick={handleManageSubscription}
                            disabled={loading}
                        >
                            {portalLoading
                                ? "Opening..."
                                : "Manage subscription"}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default SubscriptionPage;
