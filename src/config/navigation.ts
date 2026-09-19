import { CreditCard, LayoutDashboard, Sparkles } from "lucide-react";

export const appNavigation = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Subscription",
        href: "/subscription",
        icon: CreditCard,
    },
];

export const marketingHighlights = [
    {
        title: "Focus",
        description: "Clear priorities and less clutter",
        icon: Sparkles,
    },
    {
        title: "Clarity",
        description: "Simple workflows that keep momentum",
        icon: LayoutDashboard,
    },
    {
        title: "Momentum",
        description: "Track what matters and move forward",
        icon: CreditCard,
    },
];
