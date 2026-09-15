"use client";
import { createContext, useContext, useEffect, useState } from "react";

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
    // state will go here
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const refreshSubscription = async () => {
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
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        refreshSubscription();
    }, []);

    return (
        <SubscriptionContext.Provider
            value={{
                // state will go here
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
