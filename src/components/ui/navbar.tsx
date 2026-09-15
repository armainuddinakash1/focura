"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Show, UserButton } from "@clerk/nextjs";
import { useSubscription } from "@/context/SubscriptionContext";

function Navbar() {
    const { isSubscribed, isLoading } = useSubscription();
    return (
        <header className="flex justify-between items-center p-4 gap-4 h-16">
            <Show when="signed-out">
                <Link href="/">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ToDo App
                    </h1>
                </Link>
                <div>
                    <Link href="/sign-in">
                        <Button variant="ghost">Sign In</Button>
                    </Link>
                    <Link href="/sign-up">
                        <Button>Sign Up</Button>
                    </Link>
                </div>
            </Show>
            <Show when="signed-in">
                <Link href="/dashboard">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ToDo App
                    </h1>
                </Link>
                <div className="flex items-center m-4">
                    <Link href="/subscription">
                        <Button variant="default" className="p-4 m-4">
                            {isLoading
                                ? "Loading..."
                                : isSubscribed
                                  ? "Premium user"
                                  : "Subscribe"}
                        </Button>
                    </Link>
                    <UserButton />
                </div>
            </Show>
        </header>
    );
}

export default Navbar;
