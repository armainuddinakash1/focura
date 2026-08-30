"use client";

import { FormEvent, useState } from "react";

interface TodoFormProps {
    onAddTodo: (todo: any) => void;
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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                }),
            });

            if (!response.ok) throw new Error("Failed to create todo");

            const newTodo = await response.json();
            onAddTodo(newTodo);
            setTitle("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred while creating new todo");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6"
        >
            <div className="mb-4">
                <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                    Task Title *
                </label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    disabled={isLoading}
                />
            </div>

            {error && (
                <div className="mb-4 text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
                {isLoading ? "Adding..." : "Add Todo"}
            </button>
        </form>
    );
}
