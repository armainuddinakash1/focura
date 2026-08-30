import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getUserOrUnauthorized() {
    const user = await currentUser();

    if (!user) {
        return {
            user: null,
            response: NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            ),
        };
    }

    return { user, response: null };
}

export async function GET(_request: Request) {
    const { user, response } = await getUserOrUnauthorized();

    if (!user || response) {
        return response;
    }

    try {
        const todos = await prisma.todo.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(todos);
    } catch (error) {
        console.error("Error fetching todos:", error);
        return NextResponse.json(
            { error: "Failed to fetch todos" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    const { user, response } = await getUserOrUnauthorized();

    if (!user || response) {
        return response;
    }

    let payload: { title?: string };

    try {
        payload = (await request.json()) as {
            title?: string;
        };
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 },
        );
    }

    if (!payload.title || typeof payload.title !== "string") {
        return NextResponse.json(
            { error: "Title is required and must be a string" },
            { status: 400 },
        );
    }

    const trimmedTitle = payload.title.trim();

    if (!trimmedTitle) {
        return NextResponse.json(
            { error: "Title cannot be empty" },
            { status: 400 },
        );
    }

    try {
        const newTodo = await prisma.todo.create({
            data: {
                title: trimmedTitle,
                userId: user.id,
                completed: false,
            },
        });

        return NextResponse.json(newTodo, { status: 201 });
    } catch (error) {
        console.error("Error creating todo:", error);
        return NextResponse.json(
            { error: "Failed to create todo" },
            { status: 500 },
        );
    }
}
