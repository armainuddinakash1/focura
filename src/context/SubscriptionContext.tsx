"use client";

import { useAuth } from "@clerk/nextjs";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type SubscriptionStatus =
    | "ACTIVE"
    | "TRIALING"
    | "PAST_DUE"
    | "CANCELED"
    | "UNPAID"
    | "INCOMPLETE"
    | "INCOMPLETE_EXPIRED"
    | "PAUSED"
    | null;

type SubscriptionContextType = {
    hasPremiumAccess: boolean;
    subscriptionStatus: SubscriptionStatus;
    subscriptionEnd: string | null;
    subscriptionMessage: string;
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

    const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] =
        useState<SubscriptionStatus>(null);
    const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
    const [subscriptionMessage, setSubscriptionMessage] = useState(
        "You don't have an active subscription.",
    );
    const [isLoading, setIsLoading] = useState(false);

    const resetSubscription = useCallback(() => {
        setHasPremiumAccess(false);
        setSubscriptionStatus(null);
        setSubscriptionEnd(null);
        setSubscriptionMessage("You don't have an active subscription.");
    }, []);

    const refreshSubscription = useCallback(async () => {
        if (!userId) {
            resetSubscription();
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

            setHasPremiumAccess(
                Boolean(data.subscriptionAccess?.hasPremiumAccess),
            );

            setSubscriptionStatus(data.subscriptionStatus ?? null);

            setSubscriptionEnd(data.subscribtionEnd ?? null);

            setSubscriptionMessage(
                data.subscriptionAccess?.message ??
                    "You don't have an active subscription.",
            );
        } catch (error) {
            console.error("Subscription status error:", error);
            resetSubscription();
        } finally {
            setIsLoading(false);
        }
    }, [userId, resetSubscription]);

    useEffect(() => {
        void refreshSubscription();
    }, [refreshSubscription]);

    return (
        <SubscriptionContext.Provider
            value={{
                hasPremiumAccess,
                subscriptionStatus,
                subscriptionEnd,
                subscriptionMessage,
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
