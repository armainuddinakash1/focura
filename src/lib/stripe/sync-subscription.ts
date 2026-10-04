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

    await db.user.updateMany({
        where: {
            stripeCustomerId: customerId,
        },
        data: {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: status,
            subscriptionEnd: new Date(
                subscription.items.data[0].current_period_end * 1000,
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });
}
