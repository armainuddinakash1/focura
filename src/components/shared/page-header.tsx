import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
    title: string;
    description?: string;
    badge?: ReactNode;
    action?: ReactNode;
    className?: string;
};

export function PageHeader({
    title,
    description,
    badge,
    action,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
                className,
            )}
        >
            <div className="space-y-2">
                {badge ? <div>{badge}</div> : null}
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        {title}
                    </h1>
                    {description ? (
                        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
            {action ? (
                <div className="flex items-center gap-2">{action}</div>
            ) : null}
        </div>
    );
}
