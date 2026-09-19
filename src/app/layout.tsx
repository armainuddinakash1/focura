import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/ui/navbar";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Focura | Focus on what matters",
    description:
        "A calm, focused task management SaaS for staying on top of what matters most.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full text-foreground">
                <ClerkProvider>
                    <SubscriptionProvider>
                        <div className="flex min-h-screen flex-col">
                            <Navbar />
                            <main className="flex-1">{children}</main>
                            <footer className="border-t border-border/80 bg-background/80">
                                <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
                                    &copy; {new Date().getFullYear()} Focura.
                                    Focus on what matters.
                                </div>
                            </footer>
                        </div>
                    </SubscriptionProvider>
                </ClerkProvider>
            </body>
        </html>
    );
}
