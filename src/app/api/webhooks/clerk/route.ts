import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
    /*
     * 1. Verify the Clerk webhook signature.
     */
    let event;

    try {
        event = await verifyWebhook(req);
    } catch (error) {
        console.error("Clerk webhook verification failed:", error);

        return new NextResponse("Invalid webhook", {
            status: 400,
        });
    }

    /*
     * 2. Get the unique webhook delivery ID.
     */
    const webhookId = req.headers.get("svix-id");

    if (!webhookId) {
        console.error("Missing svix-id header");

        return new NextResponse("Missing webhook ID", {
            status: 400,
        });
    }

    /*
     * 3. Only process the events we care about.
     */
    if (
        event.type !== "user.created" &&
        event.type !== "user.updated" &&
        event.type !== "user.deleted"
    ) {
        return NextResponse.json({
            received: true,
            ignored: true,
        });
    }

    try {
        /*
         * 4. Check whether this webhook delivery has already
         * been successfully processed.
         */
        const existingWebhook = await prisma.processedWebhook.findUnique({
            where: {
                webhookId,
            },
        });

        if (existingWebhook) {
            return NextResponse.json({
                received: true,
                duplicate: true,
            });
        }

        /*
         * USER DELETED
         *
         * Stripe operations are intentionally performed BEFORE
         * the Prisma transaction because Stripe is an external
         * system and cannot participate in the Prisma transaction.
         */
        if (event.type === "user.deleted") {
            const clerkUserId = event.data.id;

            const user = await prisma.user.findUnique({
                where: {
                    clerkId: clerkUserId,
                },
                select: {
                    id: true,
                    stripeCustomerId: true,
                },
            });

            if (user?.stripeCustomerId) {
                /*
                 * Find all subscriptions belonging to the customer.
                 *
                 * We check all statuses because a customer may have
                 * an active, trialing, past_due, unpaid, or incomplete
                 * subscription when the account is deleted.
                 */
                const subscriptions = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId,
                    status: "all",
                });

                /*
                 * Cancel subscriptions that should not remain active
                 * after the Focura account has been deleted.
                 */
                for (const subscription of subscriptions.data) {
                    if (
                        [
                            "active",
                            "trialing",
                            "past_due",
                            "unpaid",
                            "incomplete",
                        ].includes(subscription.status)
                    ) {
                        await stripe.subscriptions.cancel(subscription.id);
                    }
                }

                /*
                 * Now delete the Stripe Customer.
                 *
                 * Stripe will retain whatever records Stripe is
                 * required to retain, but the Customer object itself
                 * is removed.
                 */
                try {
                    await stripe.customers.del(user.stripeCustomerId);
                } catch (error) {
                    /*
                     * If the customer was already deleted in Stripe,
                     * treat that as success.
                     */
                    if (
                        error instanceof Stripe.errors.StripeError &&
                        error.code === "resource_missing"
                    ) {
                        console.log(
                            `Stripe customer ${user.stripeCustomerId} was already deleted.`,
                        );
                    } else {
                        throw error;
                    }
                }
            }

            /*
             * Delete the local user and mark the webhook processed
             * in the same Prisma transaction.
             */
            await prisma.$transaction(async (tx) => {
                if (user) {
                    await tx.todo.deleteMany({
                        where: {
                            userId: user.id,
                        },
                    });

                    await tx.user.delete({
                        where: {
                            id: user.id,
                        },
                    });
                }

                await tx.processedWebhook.create({
                    data: {
                        webhookId,
                    },
                });
            });
        } else {
            /*
             * USER CREATED / UPDATED
             */
            await prisma.$transaction(async (tx) => {
                const clerkUserId = event.data.id;

                /*
                 * Clerk provides primary_email_address_id.
                 *
                 * Do NOT simply use email_addresses[0].
                 */
                const primaryEmailAddress = event.data.email_addresses.find(
                    (email) => email.id === event.data.primary_email_address_id,
                );

                if (!primaryEmailAddress) {
                    throw new Error(
                        `Clerk user ${clerkUserId} has no primary email address`,
                    );
                }

                const email = primaryEmailAddress.email_address;

                /*
                 * 1. Try to find the user using the current Clerk ID.
                 */
                const existingClerkUser = await tx.user.findUnique({
                    where: {
                        clerkId: clerkUserId,
                    },
                });

                if (existingClerkUser) {
                    await tx.user.update({
                        where: {
                            id: existingClerkUser.id,
                        },
                        data: {
                            email,
                            firstName: event.data.first_name,
                            lastName: event.data.last_name,
                            deletedAt: null,
                        },
                    });
                } else {
                    /*
                     * 2. No user exists with this Clerk ID.
                     *
                     * Check whether an old Prisma user exists
                     * with the same email.
                     */
                    const existingEmailUser = await tx.user.findUnique({
                        where: {
                            email,
                        },
                    });

                    if (existingEmailUser) {
                        /*
                         * Reconnect the existing Prisma user to
                         * the newly created Clerk account.
                         */
                        await tx.user.update({
                            where: {
                                id: existingEmailUser.id,
                            },
                            data: {
                                clerkId: clerkUserId,
                                firstName: event.data.first_name,
                                lastName: event.data.last_name,
                                deletedAt: null,
                            },
                        });
                    } else {
                        /*
                         * 3. Completely new user.
                         */
                        await tx.user.create({
                            data: {
                                clerkId: clerkUserId,
                                firstName: event.data.first_name,
                                lastName: event.data.last_name,
                                email,
                            },
                        });
                    }
                }

                /*
                 * Mark this exact webhook delivery as processed.
                 */
                await tx.processedWebhook.create({
                    data: {
                        webhookId,
                    },
                });
            });
        }

        /*
         * 5. Tell Clerk the webhook was successfully processed.
         */
        return NextResponse.json({
            received: true,
        });
    } catch (error) {
        /*
         * Return 500 so Clerk retries the webhook.
         */
        console.error("Clerk webhook processing failed:", {
            webhookId,
            eventType: event.type,
            error,
        });

        return new NextResponse("Webhook processing failed", {
            status: 500,
        });
    }
}
