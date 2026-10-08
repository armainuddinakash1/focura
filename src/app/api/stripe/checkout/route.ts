import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { addOneCalendarMonth } from "@/lib/add-one-calendar-month";

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
         * 2. Create a Stripe Customer if the stored Customer ID
         *    is missing or invalid.
         *
         * The Stripe idempotency key prevents repeated customer
         * creation requests for the same local user from creating
         * multiple Stripe Customers.
         */
        if (!customerId) {
            const customer = await stripe.customers.create(
                {
                    email: user.email,
                    name: [user.firstName, user.lastName]
                        .filter(Boolean)
                        .join(" "),
                    metadata: {
                        userId: user.id,
                        clerkId: user.clerkId,
                    },
                },
                {
                    idempotencyKey: `customer_${user.id}`,
                },
            );

            /*
             * Only set stripeCustomerId if another concurrent request
             * has not already set it.
             *
             * This prevents two concurrent requests from overwriting
             * each other's Stripe Customer ID.
             */
            const result = await prisma.user.updateMany({
                where: {
                    id: user.id,
                    stripeCustomerId: null,
                },
                data: {
                    stripeCustomerId: customer.id,
                },
            });

            if (result.count === 1) {
                /*
                 * This request successfully stored the Stripe Customer.
                 */
                customerId = customer.id;
            } else {
                /*
                 * Another concurrent request already stored the
                 * Stripe Customer ID. Use the database value instead.
                 */
                const updatedUser = await prisma.user.findUniqueOrThrow({
                    where: {
                        id: user.id,
                    },
                    select: {
                        stripeCustomerId: true,
                    },
                });

                customerId = updatedUser.stripeCustomerId;
            }
        }

        /*
         * 3. Ask Stripe whether this Customer already has
         *    a subscription.
         *
         * Do not rely on the local subscription fields here.
         * Stripe is the source of truth for whether a subscription
         * currently exists.
         */
        let strCustomerId
        if (customerId === null) {
            strCustomerId = undefined;
        } else {
            strCustomerId = customerId
        }
        const subscriptions = await stripe.subscriptions.list({
            customer: strCustomerId,
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
        const trialEnd = addOneCalendarMonth(new Date());

        const session = await stripe.checkout.sessions.create(
            {
                mode: "subscription",

                managed_payments: {
                    enabled: false,
                },

                customer: strCustomerId,

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
                    trial_end: Math.floor(trialEnd.getTime() / 1000),
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
