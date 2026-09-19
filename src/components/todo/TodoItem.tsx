"use client";

import { Check, PencilLine, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
                body: JSON.stringify({ title: editTitle.trim() }),
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
        <Card className="border-border/80 bg-card/80 shadow-sm transition-colors hover:border-primary/30">
            <CardContent className="p-4 sm:p-5">
                {isEditing ? (
                    <div className="space-y-4">
                        <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            disabled={isLoading}
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSaveEdit}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Save
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditTitle(todo.title);
                                }}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                            <button
                                type="button"
                                onClick={handleToggleComplete}
                                disabled={isLoading}
                                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                    todo.completed
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background hover:border-primary/50"
                                }`}
                                aria-label={
                                    todo.completed
                                        ? "Mark as incomplete"
                                        : "Mark as complete"
                                }
                            >
                                {todo.completed ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : null}
                            </button>

                            <div className="min-w-0 flex-1">
                                <h3
                                    className={`wrap-break-word text-base font-medium ${
                                        todo.completed
                                            ? "text-muted-foreground line-through"
                                            : "text-foreground"
                                    }`}
                                >
                                    {todo.title}
                                </h3>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {new Date(
                                        todo.createdAt,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsEditing(true)}
                                disabled={isLoading}
                                aria-label="Edit task"
                            >
                                <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleDelete}
                                disabled={isLoading}
                                aria-label="Delete task"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
