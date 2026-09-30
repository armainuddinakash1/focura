import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

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

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        let customerId = user.stripeCustomerId;

        /*
         * 1. Verify an existing Stripe Customer.
         */
        if (customerId) {
            try {
                const customer = await stripe.customers.retrieve(customerId);

                if (customer.deleted) {
                    customerId = null;
                }
            } catch (error) {
                if (
                    error instanceof Stripe.errors.StripeError &&
                    error.code === "resource_missing"
                ) {
                    customerId = null;
                } else {
                    throw error;
                }
            }
        }

        /*
         * 2. Create a new Customer if the stored one
         *    doesn't exist anymore.
         */
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: [user.firstName, user.lastName].filter(Boolean).join(" "),
                metadata: {
                    userId: user.id,
                    clerkId: user.clerkId,
                },
            });

            customerId = customer.id;

            await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    stripeCustomerId: customerId,
                },
            });
        }

        /*
         * 3. Ask Stripe whether this customer already
         *    has a subscription.
         */
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 100,
        });

        const existingSubscription = subscriptions.data.find((subscription) =>
            ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
                subscription.status,
            ),
        );

        if (existingSubscription) {
            return NextResponse.json(
                {
                    error: "You already have a subscription.",
                },
                { status: 409 },
            );
        }

        /*
         * 4. Create Checkout Session.
         */
        const session = await stripe.checkout.sessions.create(
            {
                mode: "subscription",

                customer: customerId,

                line_items: [
                    {
                        price: process.env.STRIPE_PRICE_ID!,
                        quantity: 1,
                    },
                ],

                success_url:
                    `${process.env.NEXT_PUBLIC_APP_URL}` +
                    "/dashboard?checkout=success",

                cancel_url:
                    `${process.env.NEXT_PUBLIC_APP_URL}` +
                    "/subscription?checkout=canceled",

                metadata: {
                    userId: user.id,
                },

                subscription_data: {
                    metadata: {
                        userId: user.id,
                    },
                },
            },
            {
                idempotencyKey: `checkout_${userId}_${Date.now()}`,
                /*
              For **idempotency**, don't use `Date.now()` if your goal is retry safety.

              A retry with `Date.now()` creates a different key.

              Instead, the frontend should generate/request a stable checkout attempt ID, or you can use a unique server-side operation ID.

              For example:

              ```tsx
              const idempotencyKey = `checkout_${user.id}_${checkoutAttemptId}`;
              ```

              Stripe supports idempotency keys specifically to make retrying API requests safer.
              For a portfolio project, Date.now() is enough
              */
            },
        );

        return NextResponse.json({
            url: session.url,
        });
    } catch (error) {
        console.error("Stripe checkout error:", error);

        return NextResponse.json(
            {
                error: "Unable to create checkout session",
            },
            { status: 500 },
        );
    }
}
