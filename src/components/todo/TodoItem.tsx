"use client";

import { useState } from "react";
import { Trash2, Edit2, Check } from "lucide-react";

interface Todo {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

interface TodoItemProps {
    todo: Todo;
    onUpdate: (todo: Todo) => void;
    onDelete: (id: string) => void;
}

export default function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleComplete = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/todo/${todo.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: !todo.completed }),
            });

            if (!response.ok) throw new Error("Failed to update todo");
            const updatedTodo = await response.json();
            onUpdate(updatedTodo);
        } catch (error) {
            console.error("Error toggling todo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editTitle.trim()) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/todo/${todo.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle.trim(),
                }),
            });

            if (!response.ok) throw new Error("Failed to update todo");
            const updatedTodo = await response.json();
            onUpdate(updatedTodo);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating todo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this todo?")) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/todo/${todo.id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete todo");
            onDelete(todo.id);
        } catch (error) {
            console.error("Error deleting todo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            {isEditing ? (
                <div className="space-y-4">
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        disabled={isLoading}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveEdit}
                            disabled={isLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditTitle(todo.title);
                            }}
                            disabled={isLoading}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                        <button
                            onClick={handleToggleComplete}
                            disabled={isLoading}
                            className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                todo.completed
                                    ? "bg-green-600 border-green-600"
                                    : "border-gray-300 dark:border-slate-600 hover:border-green-600"
                            }`}
                        >
                            {todo.completed && (
                                <Check className="w-4 h-4 text-white" />
                            )}
                        </button>
                        <div className="flex-1 min-w-0">
                            <h3
                                className={`text-lg font-medium break-words ${
                                    todo.completed
                                        ? "line-through text-gray-500 dark:text-gray-400"
                                        : "text-gray-900 dark:text-white"
                                }`}
                            >
                                {todo.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {new Date(todo.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 ml-4 flex-shrink-0">
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={isLoading}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:text-gray-400"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:text-gray-400"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
