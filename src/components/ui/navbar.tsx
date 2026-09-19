"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavigation } from "@/config/navigation";
import { useSubscription } from "@/context/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Navbar() {
    const pathname = usePathname();
    const { isSubscribed, isLoading } = useSubscription();

    return (
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-foreground"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold tracking-tight">
                            Focura
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Focus on what matters
                        </p>
                    </div>
                </Link>

                <Show when="signed-out">
                    <div className="flex items-center gap-2">
                        <Link href="/sign-in">
                            <Button variant="ghost" size="sm">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button size="sm">Get started</Button>
                        </Link>
                    </div>
                </Show>

                <Show when="signed-in">
                    <nav className="hidden items-center gap-1 rounded-full border border-border bg-muted/40 p-1 md:flex">
                        {appNavigation.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href;

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className="contents"
                                >
                                    <Button
                                        variant={isActive ? "default" : "ghost"}
                                        size="sm"
                                        className={cn(
                                            "gap-2 rounded-full px-3",
                                            isActive && "shadow-sm",
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/subscription"
                            className="hidden sm:inline-flex"
                        >
                            <Button
                                variant={isSubscribed ? "secondary" : "default"}
                                size="sm"
                                className="gap-2"
                            >
                                {isLoading
                                    ? "Loading..."
                                    : isSubscribed
                                      ? "Premium"
                                      : "Upgrade"}
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="icon"
                            className="md:hidden"
                            aria-label="Open navigation"
                        >
                            <Menu className="h-4 w-4" />
                        </Button>
                        <UserButton />
                    </div>
                </Show>
            </div>
        </header>
    );
}

export default Navbar;
