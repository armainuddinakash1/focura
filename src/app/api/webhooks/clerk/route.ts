import { Webhook } from "svix";
import { NextRequest, NextResponse } from "next/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return new NextResponse("Missing CLERK_WEBHOOK_SECRET", {
            status: 500,
        });
    }

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
        return new NextResponse("Missing webhook headers", { status: 400 });
    }

    const payload = await req.text();
    const webhook = new Webhook(webhookSecret);
    let event: WebhookEvent;

    try {
        event = webhook.verify(payload, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        }) as WebhookEvent;
    } catch {
        return new NextResponse("Invalid webhook signature", { status: 400 });
    }

    if (
        event.type !== "user.created" &&
        event.type !== "user.updated" &&
        event.type !== "user.deleted"
    ) {
        return NextResponse.json({ received: true });
    }
    if (event.type === "user.created" || event.type === "user.updated") {
        const email = event.data.email_addresses[0]?.email_address;

        if (!email) {
            return new NextResponse("User has no email address", {
                status: 400,
            });
        }

        await prisma.user.upsert({
            where: { id: event.data.id },
            update: { email },
            create: {
                id: event.data.id,
                email,
            },
        });

        return NextResponse.json({ received: true });
    }
    if (event.type === "user.deleted") {
        await prisma.user.update({
            where: { id: event.data.id },
            data: { deletedAt: new Date() },
        });
        return NextResponse.json({ received: true });
    }
}
