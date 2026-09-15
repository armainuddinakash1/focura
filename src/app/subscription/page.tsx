"use client";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/context/SubscriptionContext";
import { useState } from "react";
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
                body: JSON.stringify({
                    isSubscribed: newSubscriptionState,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update subscription");
            }

            refreshSubscription();
        } catch (error) {
            console.error("Subscription error:", error);
        } finally {
            setActionLoading(false);
        }
    };
    return (
        <div className="flex min-h-screen flex-col items-center justify-start text-4xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 ">
            <h1>
                {loading
                    ? "Loading..."
                    : isSubscribed
                      ? "You are a premium user"
                      : "Subscribe to create more todos"}
            </h1>
            <Button
                className="m-4 px-4 py-6 text-2xl"
                onClick={handleSubscription}
                disabled={loading}
            >
                {loading ? "..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
            </Button>
        </div>
    );
}

export default SubscriptionPage;
