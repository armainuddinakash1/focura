"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import TodoForm from "@/components/todo/TodoForm";
import TodoList from "@/components/todo/TodoList";
import { Loader } from "lucide-react";

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
                const response = await fetch("/api/todo");
                if (!response.ok) throw new Error("Failed to fetch todos");
                const data = await response.json();
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

        fetchTodos();
    }, [isLoaded, userId]);

    const handleAddTodo = (newTodo: Todo) => {
        setTodos([newTodo, ...todos]);
    };

    const handleUpdateTodo = (updatedTodo: Todo) => {
        setTodos(
            todos.map((todo) =>
                todo.id === updatedTodo.id ? updatedTodo : todo,
            ),
        );
    };

    const handleDeleteTodo = (id: string) => {
        setTodos(todos.filter((todo) => todo.id !== id));
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="mx-auto mt-2" />
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">
                    Please sign in to view your todos
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        My Todos
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Stay organized and manage your tasks efficiently
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <TodoForm onAddTodo={handleAddTodo} />

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="text-gray-600 dark:text-gray-400">
                            Loading your todos...
                        </div>
                    </div>
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
