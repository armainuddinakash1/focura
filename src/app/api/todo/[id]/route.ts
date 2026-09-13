import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getUserOrUnauthorized() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        return {
            user: null,
            response: NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            ),
        };
    }

    const user = await prisma.user.findUnique({
        where: {
            clerkId: clerkUser.id,
        },
    });

    if (!user) {
        return {
            user: null,
            response: NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            ),
        };
    }

    return { user, response: null };
}

async function getTodoById(userId: string, todoId: string) {
    return prisma.todo.findFirst({
        where: {
            id: todoId,
            userId,
        },
    });
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { user, response } = await getUserOrUnauthorized();

    if (!user || response) {
        return response;
    }

    const { id } = await params;

    try {
        const todo = await getTodoById(user.id, id);

        if (!todo) {
            return NextResponse.json(
                { error: "Todo not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(todo);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { user, response } = await getUserOrUnauthorized();

    if (!user || response) {
        return response;
    }

    const { id } = await params;

    let payload: { title?: string; completed?: boolean };

    try {
        payload = (await request.json()) as {
            title?: string;
            completed?: boolean;
        };
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 },
        );
    }

    if (payload.title === undefined && payload.completed === undefined) {
        return NextResponse.json(
            { error: "At least one field is required" },
            { status: 400 },
        );
    }

    if (payload.title !== undefined && typeof payload.title !== "string") {
        return NextResponse.json(
            { error: "Title must be a string" },
            { status: 400 },
        );
    }

    if (
        payload.completed !== undefined &&
        typeof payload.completed !== "boolean"
    ) {
        return NextResponse.json(
            { error: "Completed must be a boolean" },
            { status: 400 },
        );
    }

    if (payload.title !== undefined) {
        const trimmedTitle = payload.title.trim();

        if (!trimmedTitle) {
            return NextResponse.json(
                { error: "Title cannot be empty string" },
                { status: 400 },
            );
        }

        payload.title = trimmedTitle;
    }

    try {
        const existingTodo = await getTodoById(user.id, id);

        if (!existingTodo) {
            return NextResponse.json(
                { error: "Todo not found" },
                { status: 404 },
            );
        }

        const updatedTodo = await prisma.todo.update({
            where: {
                id: existingTodo.id,
            },
            data: {
                ...(payload.title !== undefined
                    ? { title: payload.title }
                    : {}),
                ...(payload.completed !== undefined
                    ? { completed: payload.completed }
                    : {}),
            },
        });

        return NextResponse.json(updatedTodo);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { user, response } = await getUserOrUnauthorized();

    if (!user || response) {
        return response;
    }

    const { id } = await params;

    let payload: { title?: string; completed?: boolean };

    try {
        payload = (await request.json()) as {
            title?: string;
            completed?: boolean;
        };
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 },
        );
    }

    const title = typeof payload.title === "string" ? payload.title.trim() : "";

    if (!title) {
        return NextResponse.json(
            { error: "Title is required" },
            { status: 400 },
        );
    }

    if (typeof payload.completed !== "boolean") {
        return NextResponse.json(
            { error: "Completed is required" },
            { status: 400 },
        );
    }

    try {
        const existingTodo = await getTodoById(user.id, id);

        if (!existingTodo) {
            return NextResponse.json(
                { error: "Todo not found" },
                { status: 404 },
            );
        }

        const updatedTodo = await prisma.todo.update({
            where: {
                id: existingTodo.id,
            },
            data: {
                title,
                completed: payload.completed,
            },
        });

        return NextResponse.json(updatedTodo);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { user, response } = await getUserOrUnauthorized();

    if (!user || response) {
        return response;
    }

    const { id } = await params;

    try {
        const existingTodo = await getTodoById(user.id, id);

        if (!existingTodo) {
            return NextResponse.json(
                { error: "Todo not found" },
                { status: 404 },
            );
        }

        await prisma.todo.delete({
            where: {
                id: existingTodo.id,
            },
        });

        return NextResponse.json({
            success: true,
            deletedId: existingTodo.id,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
