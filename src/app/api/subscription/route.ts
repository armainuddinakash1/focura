import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkId: clerkUser.id,
            },
            select: {
                isSubscribed: true,
                subscriptionEnd: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        if (user.subscriptionEnd && user.subscriptionEnd < new Date()) {
            const updatedUser = await prisma.user.update({
                where: {
                    clerkId: clerkUser.id,
                },
                data: {
                    isSubscribed: false,
                    subscriptionEnd: null,
                },
                select: {
                    isSubscribed: true,
                    subscriptionEnd: true,
                },
            });
            return NextResponse.json({
                message: "Subscription status fetched successfully",
                isSubscribed: updatedUser.isSubscribed,
                subscribtionEnd: updatedUser.subscriptionEnd,
            });
        }

        return NextResponse.json({
            message: "Subscription status fetched successfully",
            isSubscribed: user.isSubscribed,
            subscribtionEnd: user.subscriptionEnd,
        });
    } catch (error) {
        console.error("Subscription fetch error:", error);

        return NextResponse.json(
            { error: "Failed to fetch subscription status" },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        // Get the currently authenticated Clerk user
        const clerkUser = await currentUser();

        if (!clerkUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await req.json();
        const { isSubscribed } = body;

        // Validate request body
        if (typeof isSubscribed !== "boolean") {
            return NextResponse.json(
                { error: "isSubscribed must be a boolean" },
                { status: 400 },
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkId: clerkUser.id,
            },
            select: {
                id: true,
                clerkId: true,
                isSubscribed: true,
                subscriptionEnd: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        if (user.subscriptionEnd && user.subscriptionEnd < new Date()) {
            const updatedUser = await prisma.user.update({
                where: {
                    clerkId: clerkUser.id,
                },
                data: {
                    isSubscribed: false,
                    subscriptionEnd: null,
                },
                select: {
                    isSubscribed: true,
                    subscriptionEnd: true,
                },
            });
            return NextResponse.json({
                message: "Subscription status fetched successfully",
                isSubscribed: updatedUser.isSubscribed,
                subscribtionEnd: updatedUser.subscriptionEnd,
            });
        }

        // Prevent subscribing if the user is already subscribed
        if (isSubscribed && user.isSubscribed) {
            return NextResponse.json(
                { error: "User is already subscribed" },
                { status: 409 },
            );
        }

        // Calculate subscription end date
        let subscriptionEnd: Date | null = null;

        if (isSubscribed) {
            subscriptionEnd = new Date();
            subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
        }

        // Update the local user using Clerk's user ID
        const updatedUser = await prisma.user.update({
            where: {
                clerkId: clerkUser.id,
            },
            data: {
                isSubscribed,
                subscriptionEnd,
            },
            select: {
                id: true,
                clerkId: true,
                isSubscribed: true,
                subscriptionEnd: true,
            },
        });

        return NextResponse.json(
            {
                message: isSubscribed
                    ? "Subscribed successfully"
                    : "Unsubscribed successfully",
                updatedUser,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Subscription update error:", error);

        return NextResponse.json(
            { error: "Failed to update subscription" },
            { status: 500 },
        );
    }
}
