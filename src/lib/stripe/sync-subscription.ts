import Stripe from "stripe";
import { Prisma } from "@/generated/prisma/client";

function mapStripeStatus(status: Stripe.Subscription.Status) {
    switch (status) {
        case "incomplete":
            return "INCOMPLETE";

        case "trialing":
            return "TRIALING";

        case "active":
            return "ACTIVE";

        case "past_due":
            return "PAST_DUE";

        case "canceled":
            return "CANCELED";

        case "unpaid":
            return "UNPAID";

        case "incomplete_expired":
            return "INCOMPLETE_EXPIRED";

        default:
            throw new Error(`Unsupported Stripe status: ${status}`);
    }
}

function isCancellationScheduled(subscription: Stripe.Subscription): boolean {
    return subscription.cancel_at_period_end || subscription.cancel_at !== null;
}

export async function syncStripeSubscription(
    subscription: Stripe.Subscription,
    db: Prisma.TransactionClient,
) {
    const customerId =
        typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

    const status = mapStripeStatus(subscription.status);

    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

    if (currentPeriodEnd === undefined) {
        throw new Error(
            `Stripe subscription ${subscription.id} has no current period end`,
        );
    }

    const cancellationScheduled = isCancellationScheduled(subscription);

    const result = await db.user.updateMany({
        where: {
            stripeCustomerId: customerId,
        },
        data: {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: status,
            subscriptionEnd: cancellationScheduled
                ? new Date(currentPeriodEnd * 1000)
                : null,
            cancelAtPeriodEnd: cancellationScheduled,
        },
    });

    if (result.count === 0) {
        throw new Error(
            `No user found for Stripe customer ${customerId} while syncing subscription ${subscription.id}`,
        );
    }
}
