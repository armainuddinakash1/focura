export function getSubscriptionAccess(subscriptionStatus: string | null) {
    switch (subscriptionStatus) {
        case "ACTIVE":
            return {
                hasPremiumAccess: true,
                message: "Your subscription is active.",
            };

        case "TRIALING":
            return {
                hasPremiumAccess: true,
                message: "Your free trial is active.",
            };

        case "PAST_DUE":
            return {
                hasPremiumAccess: false,
                message:
                    "Your latest payment failed. Please update your payment method to restore your subscription.",
            };

        case "CANCELED":
            return {
                hasPremiumAccess: false,
                message: "Your subscription has been canceled.",
            };

        case "UNPAID":
            return {
                hasPremiumAccess: false,
                message:
                    "Your subscription has been suspended because of an unpaid payment.",
            };

        case "INCOMPLETE":
            return {
                hasPremiumAccess: false,
                message: "Your subscription payment could not be completed.",
            };

        case "INCOMPLETE_EXPIRED":
            return {
                hasPremiumAccess: false,
                message:
                    "Your subscription setup has expired. Please subscribe again.",
            };

        case "PAUSED":
            return {
                hasPremiumAccess: false,
                message: "Your subscription is currently paused.",
            };

        case null:
            // User has never had a subscription
            return {
                hasPremiumAccess: false,
                message: "You don't have an active subscription.",
            };

        default:
            return {
                hasPremiumAccess: false,
                message: "You don't have an active subscription.",
            };
    }
}
