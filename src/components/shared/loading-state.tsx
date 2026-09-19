import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
    label?: string;
    className?: string;
};

export function LoadingState({
    label = "Loading...",
    className,
}: LoadingStateProps) {
    return (
        <div
            className={cn(
                "flex min-h-50 items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/60 text-sm text-muted-foreground",
                className,
            )}
        >
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            <span>{label}</span>
        </div>
    );
}
