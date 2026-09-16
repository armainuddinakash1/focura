"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type SubscriptionContextType = {
    isSubscribed: boolean;
    isLoading: boolean;
    refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
    undefined,
);

export function SubscriptionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = useAuth();

    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const refreshSubscription = async () => {
        // No user is signed in
        if (!userId) {
            setIsSubscribed(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/subscription");

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to fetch subscription status",
                );
            }

            setIsSubscribed(data.isSubscribed);
        } catch (error) {
            console.error("Subscription status error:", error);
            setIsSubscribed(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshSubscription();
    }, [userId]);

    return (
        <SubscriptionContext.Provider
            value={{
                isSubscribed,
                isLoading,
                refreshSubscription,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);

    if (!context) {
        throw new Error(
            "useSubscription must be used within SubscriptionProvider",
        );
    }

    return context;
}
