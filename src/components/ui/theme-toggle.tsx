"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const THEME_STORAGE_KEY = "focura-theme";
const THEME_CHANGE_EVENT = "focura-theme-change";

function subscribeToTheme(onStoreChange: () => void) {
    window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function getThemeSnapshot() {
    return document.documentElement.classList.contains("dark");
}

function getServerThemeSnapshot() {
    return false;
}

export function ThemeToggle() {
    const isDark = useSyncExternalStore(
        subscribeToTheme,
        getThemeSnapshot,
        getServerThemeSnapshot,
    );

    const toggleTheme = () => {
        const nextIsDark = !document.documentElement.classList.contains("dark");

        document.documentElement.classList.toggle("dark", nextIsDark);
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));

        try {
            window.localStorage.setItem(
                THEME_STORAGE_KEY,
                nextIsDark ? "dark" : "light",
            );
        } catch {
            // The theme still applies for this visit if storage is unavailable.
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-pressed={isDark}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            {isDark ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
        </Button>
    );
}
