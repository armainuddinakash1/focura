"use client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
function SubscriptionPage() {
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getSubscriptionStatus = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/subscription");

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Failed to fetch subscription status",
                    );
                }

                setSubscribed(data.isSubscribed);
            } catch (error) {
                console.error("Subscription status error:", error);
            } finally {
                setLoading(false);
            }
        };

        getSubscriptionStatus();
    }, []);

    const handleSubscription = async () => {
        const newSubscriptionState = !subscribed;

        try {
            setLoading(true);

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

            setSubscribed(newSubscriptionState);
        } catch (error) {
            console.error("Subscription error:", error);
        } finally {
            setLoading(false);
        }
    };
    return (
        // <div className="flex min-h-screen items-top justify-center bg-background text-4xl">
        <div className="flex min-h-screen flex-col items-center justify-start text-4xl">
            {/* align items vertically */}
            <h1>
                {loading
                    ? "..."
                    : subscribed
                      ? "You are a premium user"
                      : "Subscribe to create more todos"}
            </h1>
            <Button
                className="m-4 px-4 py-6 text-2xl"
                onClick={handleSubscription}
                disabled={loading}
            >
                {loading ? "..." : subscribed ? "Unsubscribe" : "Subscribe"}
            </Button>
        </div>
    );
}

export default SubscriptionPage;
