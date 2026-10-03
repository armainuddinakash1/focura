import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
        });

        if (!user?.stripeCustomerId) {
            return NextResponse.json(
                { error: "Stripe customer not found" },
                { status: 404 },
            );
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,

            return_url: `${process.env.NEXT_PUBLIC_APP_URL}` + "/subscription",
        });

        return NextResponse.json({
            url: session.url,
        });
    } catch (error) {
        console.error("Stripe portal error:", error);

        return NextResponse.json(
            { error: "Unable to open billing portal" },
            { status: 500 },
        );
    }
}
