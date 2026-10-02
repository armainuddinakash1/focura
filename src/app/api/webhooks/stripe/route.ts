import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { syncStripeSubscription } from "@/lib/stripe/sync-subscription";

export async function POST(req: Request) {
    const body = await req.text();

    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json(
            { error: "Missing Stripe signature" },
            { status: 400 },
        );
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        );
    } catch (error) {
        console.error("Stripe webhook signature verification failed:", error);

        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 },
        );
    }

    try {
        /*
         * Check whether Stripe has already delivered this event.
         */
        const existingEvent = await prisma.processedStripeEvent.findUnique({
            where: {
                id: event.id,
            },
        });

        if (existingEvent) {
            return NextResponse.json({
                received: true,
            });
        }

        /*
         * Process the event and record it as processed
         * in the same database transaction.
         */
        await prisma.$transaction(async (tx) => {
            switch (event.type) {
                case "customer.subscription.created":
                case "customer.subscription.updated":
                case "customer.subscription.deleted": {
                    const subscription = event.data.object;

                    await syncStripeSubscription(subscription, tx);

                    break;
                }

                case "invoice.paid": {
                    /*
                     * Useful for confirming recurring payments.
                     *
                     * The subscription.updated webhook will also
                     * synchronize the subscription status.
                     */
                    break;
                }

                case "invoice.payment_failed": {
                    /*
                     * Stripe will update the subscription state.
                     * The subscription.updated webhook synchronizes
                     * it into Prisma.
                     */
                    break;
                }

                default:
                    console.log(`Unhandled Stripe event: ${event.type}`);
            }
            await tx.processedStripeEvent.create({
                data: {
                    id: event.id,
                    type: event.type,
                },
            });
        });

        return NextResponse.json({ received: true });
    } catch (error) {
        /*
         * A duplicate concurrent delivery can reach here because
         * the ProcessedStripeEvent.id is unique.
         *
         * If another request already processed the event, we can
         * safely acknowledge it.
         */
        if (
            error instanceof Error &&
            error.message.includes("Unique constraint failed")
        ) {
            return NextResponse.json({
                received: true,
            });
        }

        console.error("Stripe webhook processing failed:", error);

        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 },
        );
    }
}
