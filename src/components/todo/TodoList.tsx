"use client";

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
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No todos yet. Create one to get started!
                </p>
            </div>
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
