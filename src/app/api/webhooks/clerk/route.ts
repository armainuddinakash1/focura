import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    /*
     * 1. Verify the Clerk webhook signature.
     *
     * verifyWebhook() reads CLERK_WEBHOOK_SIGNING_SECRET
     * from the environment automatically.
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
     *
     * Clerk uses this ID for the individual webhook delivery.
     * We store it so retries/duplicate deliveries are idempotent.
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
         * 4. Atomically register the webhook.
         *
         * If this ID already exists, this delivery has already
         * been processed successfully.
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
         * 5. Process the event and record the webhook in the
         * same database transaction.
         *
         * This is important:
         *
         * User update succeeds
         *       +
         * ProcessedWebhook insert succeeds
         *       = transaction commits
         *
         * If anything fails, the entire transaction rolls back,
         * allowing Clerk to retry the webhook.
         */
        await prisma.$transaction(async (tx) => {
            /*
             * USER CREATED / UPDATED
             */
            if (
                event.type === "user.created" ||
                event.type === "user.updated"
            ) {
                const clerkUserId = event.data.id;

                /*
                 * Clerk provides primary_email_address_id.
                 *
                 * Do NOT simply use email_addresses[0], because
                 * the first email in the array is not guaranteed
                 * to be the user's primary email.
                 */
                const primaryEmailAddress = event.data.email_addresses.find(
                    (email) => email.id === event.data.primary_email_address_id,
                );

                /*
                 * Your Prisma schema requires email.
                 *
                 * Therefore, we cannot create/update the local
                 * user without a primary email.
                 */
                if (!primaryEmailAddress) {
                    throw new Error(
                        `Clerk user ${clerkUserId} has no primary email address`,
                    );
                }

                const email = primaryEmailAddress.email_address;

                /*
                 * 1. Try to find the user using the current Clerk ID.
                 *
                 * This is the normal path for user.updated.
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
                                email,
                            },
                        });
                    }
                }
            }

            /*
             * USER DELETED
             */
            if (event.type === "user.deleted") {
                const clerkUserId = event.data.id;

                /*
                 * Soft-delete instead of deleting the database row.
                 *
                 * This preserves:
                 * - todos
                 * - subscriptions
                 * - historical relationships
                 * - internal records
                 */
                await tx.user.updateMany({
                    where: {
                        clerkId: clerkUserId,
                        deletedAt: null,
                    },

                    data: {
                        deletedAt: new Date(),
                    },
                });
            }

            /*
             * 6. Mark this exact webhook delivery as processed.
             *
             * Because this happens inside the transaction, the
             * webhook will only be marked processed if the actual
             * user operation succeeded.
             */
            await tx.processedWebhook.create({
                data: {
                    webhookId,
                },
            });
        });

        /*
         * 7. Tell Clerk the webhook was successfully processed.
         */
        return NextResponse.json({
            received: true,
        });
    } catch (error) {
        /*
         * IMPORTANT:
         *
         * We intentionally return 500 here.
         *
         * Clerk will retry failed webhook deliveries when your
         * endpoint returns a 4xx/5xx response.
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
