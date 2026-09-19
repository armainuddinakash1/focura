"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowRight, ListTodo } from "lucide-react";
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

                const response = await fetch("/api/todo");

                if (!response.ok) {
                    throw new Error("Failed to fetch todos");
                }

                const data: Todo[] = await response.json();
                setTodos(data);
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
                        <ListTodo className="h-3.5 w-3.5" /> Today
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
