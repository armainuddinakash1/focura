"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

import TodoItem from "./TodoItem";

interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

interface TodoListProps {
    todos: Todo[];
    onUpdateTodo: (todo: Todo) => void;
    onDeleteTodo: (id: string) => void;
}

export default function TodoList({
    todos,
    onUpdateTodo,
    onDeleteTodo,
}: TodoListProps) {
    if (todos.length === 0) {
        return (
            <EmptyState
                title="No tasks yet"
                description="Create your first task to build momentum and get organized."
                action={
                    <Button variant="outline" size="sm">
                        Add a task
                    </Button>
                }
            />
        );
    }

    return (
        <div className="space-y-4">
            {todos.map((todo) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onUpdate={onUpdateTodo}
                    onDelete={onDeleteTodo}
                />
            ))}
        </div>
    );
}
