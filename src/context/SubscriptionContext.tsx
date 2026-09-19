"use client";

import { useAuth } from "@clerk/nextjs";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

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

    const refreshSubscription = useCallback(async () => {
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

            setIsSubscribed(Boolean(data.isSubscribed));
        } catch (error) {
            console.error("Subscription status error:", error);
            setIsSubscribed(false);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        let isActive = true;

        const loadSubscription = async () => {
            if (!userId) {
                if (isActive) {
                    setIsSubscribed(false);
                    setIsLoading(false);
                }
                return;
            }

            if (isActive) {
                setIsLoading(true);
            }

            try {
                const response = await fetch("/api/subscription");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Failed to fetch subscription status",
                    );
                }

                if (isActive) {
                    setIsSubscribed(Boolean(data.isSubscribed));
                }
            } catch (error) {
                console.error("Subscription status error:", error);
                if (isActive) {
                    setIsSubscribed(false);
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void loadSubscription();

        return () => {
            isActive = false;
        };
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
