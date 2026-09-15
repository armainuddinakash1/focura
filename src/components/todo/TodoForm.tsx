"use client";

import { FormEvent, useState } from "react";

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

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Title is required");
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
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-slate-800"
        >
            <div className="mb-4">
                <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    Task Title *
                </label>

                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    disabled={isLoading}
                />
            </div>

            {error && (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
                {isLoading ? "Adding..." : "Add Todo"}
            </button>
        </form>
    );
}
