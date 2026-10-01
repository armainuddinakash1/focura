import { NextResponse } from "next/server";

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
        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object;

                await syncStripeSubscription(subscription);

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

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Stripe webhook processing failed:", error);

        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 },
        );
  }
}
