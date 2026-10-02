import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscriptionAccess } from "@/lib/stripe/get-subscription-access";

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
                subscriptionStatus: true,
                subscriptionEnd: true,
            },
        });
        
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }
        
        const subscriptionAccess = getSubscriptionAccess(user.subscriptionStatus);

        return NextResponse.json({
            message: "Subscription status fetched successfully",
            subscriptionStatus: user.subscriptionStatus,
            subscriptionAccess,
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
