import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { addOneCalendarMonth } from "@/lib/add-one-calendar-month";

// Prevent a second checkout while the customer has a subscription in a state
// that still requires attention or may become active.
const SUBSCRIPTION_STATUSES_THAT_BLOCK_NEW_CHECKOUT = [
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "incomplete",
    "paused",
] as const;

export async function POST(request: Request) {
    try {
        // Require an authenticated Clerk user before accessing billing data.
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // The attempt ID is used as part of Stripe’s idempotency key so retries
        // of the same checkout attempt do not create duplicate sessions.
        const body = await request.json();
        const { checkoutAttemptId } = body;

        if (!checkoutAttemptId || typeof checkoutAttemptId !== "string") {
            return NextResponse.json(
                { error: "Missing checkout attempt ID" },
                { status: 400 },
            );
        }

        // Map the authenticated Clerk identity to the local application user.
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

        // Reuse the stored Stripe customer when possible; validate that it still exists
        // and synchronize the local subscription fields with Stripe.
        let customerId = user.stripeCustomerId;

        if (customerId) {
            try {
                const customer = await stripe.customers.retrieve(customerId);

                // A deleted Stripe customer cannot be used for checkout, so clear
                // its ID and the subscription data associated with it locally.
                if (customer.deleted) {
                    await prisma.user.updateMany({
                        where: {
                            id: user.id,
                            stripeCustomerId: customerId,
                        },
                        data: {
                            stripeCustomerId: null,
                            stripeSubscriptionId: null,
                            subscriptionStatus: null,
                            subscriptionEnd: null,
                            cancelAtPeriodEnd: false,
                        },
                    });

                    customerId = null;
                }

                if (!customer.deleted) {
                    // Check all subscription statuses, not only active ones, because
                    // incomplete or payment-problem subscriptions should also block checkout.
                    // Recheck subscriptions immediately before creating checkout. This also
                    // covers the path where a Stripe customer was just created or recovered.
                    const subscriptions = await stripe.subscriptions.list({
                        customer: customer.id,
                        status: "all",
                        limit: 100,
                    });

                    const existingSubscription = subscriptions.data.find(
                        (subscription) =>
                            SUBSCRIPTION_STATUSES_THAT_BLOCK_NEW_CHECKOUT.includes(
                                subscription.status as (typeof SUBSCRIPTION_STATUSES_THAT_BLOCK_NEW_CHECKOUT)[number],
                            ),
                    );

                    // Refresh the local subscription snapshot when Stripe has a
                    // subscription that should prevent a new checkout.
                    if (existingSubscription) {
                        await prisma.user.updateMany({
                            where: {
                                id: user.id,
                                stripeCustomerId: customerId,
                            },
                            data: {
                                subscriptionStatus:
                                    existingSubscription.status.toUpperCase() as
                                        | "INCOMPLETE"
                                        | "TRIALING"
                                        | "ACTIVE"
                                        | "PAST_DUE"
                                        | "CANCELED"
                                        | "UNPAID"
                                        | "INCOMPLETE_EXPIRED"
                                        | "PAUSED",

                                subscriptionEnd: new Date(
                                    existingSubscription.items.data[0]!
                                        .current_period_end * 1000,
                                ),
                                cancelAtPeriodEnd:
                                    existingSubscription.cancel_at_period_end,
                                stripeSubscriptionId: existingSubscription.id,
                            },
                        });
                    } else {
                        // No blocking subscription remains for this customer; clear
                        // stale local billing references so a new customer can be created.
                        await prisma.user.updateMany({
                            where: {
                                id: user.id,
                                stripeCustomerId: customerId,
                            },
                            data: {
                                stripeCustomerId: null,
                                stripeSubscriptionId: null,
                                subscriptionStatus: null,
                                subscriptionEnd: null,
                                cancelAtPeriodEnd: false,
                            },
                        });

                        customerId = null;
                    }
                }
            } catch (error) {
                // Stripe may report that the saved customer ID no longer exists.
                // Recover from that specific case; let other errors reach the outer handler.
                if (
                    error instanceof Stripe.errors.StripeError &&
                    error.code === "resource_missing"
                ) {
                    await prisma.user.updateMany({
                        where: {
                            id: user.id,
                            stripeCustomerId: customerId,
                        },
                        data: {
                            stripeCustomerId: null,
                            stripeSubscriptionId: null,
                            subscriptionStatus: null,
                            subscriptionEnd: null,
                            cancelAtPeriodEnd: false,
                        },
                    });

                    customerId = null;
                } else {
                    throw error;
                }
            }
        }

        if (!customerId) {
            // Create a Stripe customer only when no valid customer ID is available.
            // The idempotency key helps avoid duplicate customers if this request is retried.
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
            // Only attach the new customer if another request has not already done so.
            // This conditional update helps handle concurrent checkout requests safely.
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
                customerId = customer.id;
            } else {
                // Another request may have won the race to save a customer ID;
                // read the persisted value rather than overwriting it.
                const updatedUser = await prisma.user.findUniqueOrThrow({
                    where: {
                        id: user.id,
                    },
                    select: {
                        stripeCustomerId: true,
                    },
                });

                customerId = updatedUser.stripeCustomerId;

                if (!customerId) {
                    throw new Error(
                        "Stripe Customer ID could not be determined.",
                    );
                }
            }
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 100,
        });

        const existingSubscription = subscriptions.data.find((subscription) =>
            SUBSCRIPTION_STATUSES_THAT_BLOCK_NEW_CHECKOUT.includes(
                subscription.status as (typeof SUBSCRIPTION_STATUSES_THAT_BLOCK_NEW_CHECKOUT)[number],
            ),
        );

        if (existingSubscription) {
            // Return a conflict response instead of allowing a duplicate subscription.
            const status = existingSubscription.status;

            let errorMessage = "You already have a subscription.";

            if (status === "past_due") {
                errorMessage =
                    "Your subscription has a payment problem. Please update your payment method.";
            } else if (status === "unpaid") {
                errorMessage =
                    "Your subscription is unpaid. Please update your payment method.";
            } else if (status === "incomplete") {
                errorMessage =
                    "Your previous subscription setup is incomplete. Please complete the payment process.";
            } else if (status === "paused") {
                errorMessage =
                    "Your subscription is paused. Please manage your subscription to resume it.";
            }

            return NextResponse.json(
                {
                    error: errorMessage,
                    code: "SUBSCRIPTION_EXISTS",
                    subscriptionStatus: status,
                    subscriptionId: existingSubscription.id,
                },
                { status: 409 },
            );
        }

        // Calculate the trial end using calendar-month logic rather than assuming
        // every month contains a fixed number of days.
        const trialEnd = addOneCalendarMonth(new Date());

        // Create a Stripe-hosted subscription checkout session with the configured
        // price, redirect URLs, trial period, and app-user metadata.
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

                // This message is specifically for test mode; update or remove it
                // before enabling live payments.
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
                // Reusing this key for the same user and attempt makes session
                // creation safe to retry without creating duplicate sessions.
                idempotencyKey: `checkout_${user.id}_${checkoutAttemptId}`,
            },
        );

        // The client can redirect the user to this Stripe Checkout URL.
        return NextResponse.json({
            url: session.url,
        });
    } catch (error) {
        // Log the underlying error for diagnostics while returning a generic
        // message to avoid exposing internal details to the client.
        console.error("Stripe checkout error:", error);

        return NextResponse.json(
            {
                error: "Unable to create checkout session",
            },
            { status: 500 },
        );
    }
}
