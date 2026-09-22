"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowRight, CheckCircle2, Circle, ListTodo } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import TodoForm from "@/components/todo/TodoForm";
import TodoList from "@/components/todo/TodoList";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Todo {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function DashboardPage() {
    const { isLoaded, userId } = useAuth();

    const [todos, setTodos] = useState<Todo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded || !userId) return;

        const fetchTodos = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const maxAttempts = 5;
                const retryDelay = 500;

                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    const response = await fetch("/api/todo");

                    if (response.ok) {
                        const data: Todo[] = await response.json();
                        setTodos(data);
                        return;
                    }

                    /*
                     * A newly created Clerk user may not yet exist
                     * in our local database because the Clerk webhook
                     * is asynchronous.
                     *
                     * Retry only for "User not found".
                     */
                    if (response.status === 404 && attempt < maxAttempts) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, retryDelay),
                        );
                        continue;
                    }

                    throw new Error("Failed to fetch todos");
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "An error occurred while fetching todos",
                );
            } finally {
                setIsLoading(false);
            }
        };

        void fetchTodos();
    }, [isLoaded, userId]);

    const handleAddTodo = (newTodo: Todo) => {
        setTodos((currentTodos) => [newTodo, ...currentTodos]);
    };

    const handleUpdateTodo = (updatedTodo: Todo) => {
        setTodos((currentTodos) =>
            currentTodos.map((todo) =>
                todo.id === updatedTodo.id ? updatedTodo : todo,
            ),
        );
    };

    const handleDeleteTodo = (id: string) => {
        setTodos((currentTodos) =>
            currentTodos.filter((todo) => todo.id !== id),
        );
    };

    /*
     * Dashboard statistics
     */
    const totalTasks = todos.length;
    const completedTasks = todos.filter((todo) => todo.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    const completedPercentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const pendingPercentage =
        totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

    if (!isLoaded) {
        return (
            <LoadingState
                label="Preparing your workspace..."
                className="min-h-[60vh]"
            />
        );
    }

    if (!userId) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-4">
                <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                    <p className="text-lg font-medium text-foreground">
                        Please sign in to view your tasks
                    </p>

                    <Link href="/sign-in">
                        <Button className="mt-4">Go to sign in</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                badge={
                    <Badge variant="secondary" className="gap-2">
                        <ListTodo className="h-3.5 w-3.5" />
                        Today
                    </Badge>
                }
                title="My focus list"
                description="Keep your priorities clear, one task at a time."
                action={
                    <Button variant="secondary" size="sm" className="gap-2">
                        Review plan
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                }
            />

            {error ? (
                <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {/* Task statistics */}
            {!isLoading && (
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {/* Total */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <ListTodo className="h-5 w-5 text-primary" />
                            </div>

                            <Badge
                                variant="secondary"
                                className="text-xs font-medium"
                            >
                                All tasks
                            </Badge>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">
                                Total Tasks
                            </p>

                            <p className="mt-1 text-3xl font-semibold tracking-tight">
                                {totalTasks}
                            </p>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                            {totalTasks === 0
                                ? "No tasks yet"
                                : "Tasks in your focus list"}
                        </p>
                    </div>

                    {/* Completed */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>

                            <Badge
                                variant="secondary"
                                className="text-xs font-medium"
                            >
                                {completedPercentage}%
                            </Badge>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">
                                Completed
                            </p>

                            <p className="mt-1 text-3xl font-semibold tracking-tight">
                                {completedTasks}
                            </p>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                            {completedTasks === 0
                                ? "Nothing completed yet"
                                : `${completedPercentage}% of all tasks`}
                        </p>
                    </div>

                    {/* Pending */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                                <Circle className="h-5 w-5 text-amber-600" />
                            </div>

                            <Badge
                                variant="secondary"
                                className="text-xs font-medium"
                            >
                                {pendingPercentage}%
                            </Badge>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">
                                Pending
                            </p>

                            <p className="mt-1 text-3xl font-semibold tracking-tight">
                                {pendingTasks}
                            </p>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                            {pendingTasks === 0
                                ? "All tasks completed"
                                : `${pendingPercentage}% still remaining`}
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-8 space-y-6">
                <TodoForm onAddTodo={handleAddTodo} />

                {isLoading ? (
                    <LoadingState label="Loading tasks..." />
                ) : (
                    <TodoList
                        todos={todos}
                        onUpdateTodo={handleUpdateTodo}
                        onDeleteTodo={handleDeleteTodo}
                    />
                )}
            </div>
        </div>
    );
}
