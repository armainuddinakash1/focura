import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { checkoutAttemptId } = body;

        if (!checkoutAttemptId || typeof checkoutAttemptId !== "string") {
            return NextResponse.json(
                { error: "Missing checkout attempt ID" },
                { status: 400 },
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
         * 1. Verify the existing Stripe Customer.
         *
         * The database may contain a Stripe Customer ID that no longer
         * exists, for example if the Customer was deleted from Stripe.
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
         * 2. Create a new Stripe Customer if the stored
         *    Customer ID is missing or invalid.
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
         * 3. Ask Stripe whether this Customer already has
         *    a subscription.
         *
         * Do not rely on the local subscription fields here.
         * Stripe is the source of truth for whether a subscription
         * currently exists.
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

                managed_payments: {
                    enabled: false,
                },

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

                custom_text: {
                    submit: {
                        message:
                            "TEST MODE — No real payment will be charged. Use 4242 4242 4242 4242, any future expiry date (e.g. 12/30), and any 3-digit CVV (e.g. 789).",
                    },
                },

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
                /*
                 * Use the stable checkout attempt ID rather than
                 * Date.now() so the same attempt can safely be retried.
                 */
                idempotencyKey: `checkout_${user.id}_${checkoutAttemptId}`,
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
