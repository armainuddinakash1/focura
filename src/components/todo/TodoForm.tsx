"use client";

import { Plus } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Todo {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

interface TodoFormProps {
    onAddTodo: (todo: Todo) => void;
}

export default function TodoForm({ onAddTodo }: TodoFormProps) {
    const [title, setTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const shouldFocusInput = useRef(false);

    useEffect(() => {
        if (!isLoading && shouldFocusInput.current) {
            inputRef.current?.focus();
            shouldFocusInput.current = false;
        }
    }, [isLoading]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Title is required");
            inputRef.current?.focus();
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/todo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            onAddTodo(data);
            setTitle("");

            shouldFocusInput.current = true;
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong",
            );

            shouldFocusInput.current = true;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-5 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Task title</Label>

                        <Input
                            ref={inputRef}
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs attention today?"
                            disabled={isLoading}
                        />
                    </div>

                    {error ? (
                        <p
                            className="text-sm text-destructive"
                            role="alert"
                        >
                            {error}
                        </p>
                    ) : null}

                    <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={isLoading}
                    >
                        <Plus className="h-4 w-4" />
                        {isLoading ? "Adding task..." : "Add task"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}