import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
};

export function EmptyState({
    title,
    description,
    action,
    icon = <FolderOpen className="h-5 w-5" />,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center",
                className,
            )}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {icon}
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                    {title}
                </h3>
                {description ? (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {action ? <div>{action}</div> : null}
        </div>
    );
}
