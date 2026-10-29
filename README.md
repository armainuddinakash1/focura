# Focura

Focura is a focus-first SaaS productivity app built with Next.js, Clerk, Prisma, and Stripe. It helps users manage a personal task list, stay organized, and unlock premium productivity features through a simple subscription flow.

This project is structured as a modern SaaS starter with:

- Clerk-powered authentication and protected routes
- Prisma + PostgreSQL persistence
- Stripe checkout and subscription management
- A free tier with a task cap and a premium tier with unlimited tasks
- Webhook-driven sync between Clerk, Stripe, and local user data
- A clean dashboard optimized for task tracking and daily focus

## Why Focura?

Focura is designed around a simple idea: reduce friction and help users focus on what matters most. Instead of a cluttered productivity platform, it emphasizes a clean workflow:

- quick task capture
- clear personal task lists
- premium upgrade path when users need more capacity
- secure account lifecycle management
- production-ready patterns for SaaS authentication and billing

## App overview

At a high level, Focura combines three pillars:

1. Authentication and user identity through Clerk
2. User-specific task data stored in PostgreSQL with Prisma
3. Subscription gating and billing via Stripe

Users sign up through Clerk, their account is synchronized into the app’s local database, and their todo data is scoped to that authenticated user. The dashboard shows the current tasks, while premium access unlocks broader usage limits.

## Key features

### Authentication and account sync

- Sign in, sign up, and forgot-password flows powered by Clerk
- Route protection using Clerk middleware
- Automatic redirect to the dashboard when a user is already signed in
- Clerk webhooks syncing user creation, update, and deletion events into Prisma
- Local user records created or updated against Clerk identity

### Todo management

- Create, read, update, and delete todos
- Each todo belongs to the current authenticated user
- Tasks are sorted by creation time in descending order
- Free users are limited to a capped number of tasks to encourage upgrade
- Premium users can create unlimited tasks

### Subscription model

- Free-tier access with limited task count
- Premium access for unlimited tasks and enhanced planning workflow
- Stripe Checkout for subscription purchases
- Stripe Customer Portal for managing an active or canceled plan
- Subscription status sync across Stripe webhooks and Prisma records
- Support for statuses such as ACTIVE, TRIALING, PAUSED, PAST_DUE, and CANCELED

### SaaS architecture patterns

- Protected API routes using authenticated Clerk user identity
- Webhook idempotency via processed webhook records
- Stripe event deduplication with processed Stripe event IDs
- Recovery paths for delayed Clerk user creation after login
- Responsive user experience built with Next.js App Router and Tailwind UI primitives

## Tech stack

- Next.js 16
- React 19
- TypeScript
- PostgreSQL
- Prisma ORM
- Clerk for authentication and user management
- Stripe for billing and subscriptions
- Tailwind CSS
- shadcn-style UI primitives

## Project structure

```bash
.
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── assets and app images
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── stripe/
│   │   │   ├── subscription/
│   │   │   ├── todo/
│   │   │   ├── user/
│   │   │   └── webhooks/
│   │   ├── dashboard/
│   │   ├── forgot-password/
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── subscription/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── shared/
│   │   ├── todo/
│   │   └── ui/
│   ├── config/
│   ├── context/
│   ├── lib/
│   ├── generated/
│   ├── proxy.ts
│   └── ...
├── .env
├── AGENTS.md
├── CLAUDE.md
├── components.json
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma.config.ts
├── tsconfig.json
├── README.md
└── package-lock.json
```

## Prerequisites

Before running Focura locally, make sure you have:

- Node.js 20 or newer
- npm
- PostgreSQL database running locally or in a managed environment
- A Clerk project configured
- A Stripe account with a test mode setup

## Environment variables

Create a `.env` file in the project root and add the following values.

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/focura?schema=public"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
CLERK_WEBHOOK_SIGNING_SECRET="your_clerk_webhook_signing_secret"

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_signing_secret"
STRIPE_PRICE_ID="your_recurring_price_id"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### What each variable does

- `DATABASE_URL`: the PostgreSQL connection string used by Prisma
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: public Clerk key for frontend auth flows
- `CLERK_SECRET_KEY`: server-side Clerk key for API and webhook verification
- `CLERK_WEBHOOK_SIGNING_SECRET`: validates incoming Clerk webhook events
- `NEXT_PUBLIC_CLERK_*_URL`: route configuration expected by Clerk auth pages
- `STRIPE_SECRET_KEY`: used to create Checkout sessions and customer portal requests
- `STRIPE_WEBHOOK_SECRET`: validates incoming Stripe webhook events
- `STRIPE_PRICE_ID`: the Stripe recurring price ID tied to the premium plan
- `NEXT_PUBLIC_APP_URL`: base URL used for checkout redirects and callback URLs

## Database setup

This project uses Prisma with PostgreSQL.

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Run the database migrations:

```bash
npx prisma migrate dev
```

If you are setting up a fresh database and want to skip the migration history flow, you can also use:

```bash
npx prisma db push
```

## Running the app locally

Start the development server:

```bash
npm run dev
```

Then open the app in your browser:

```text
http://localhost:3000
```

## Production build

Run the production build:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

## App flow

### 1. Sign up and sign in

Users create an account with Clerk. The app enforces route protection so only authenticated users can access dashboard and subscription pages.

### 2. Local user sync

A Clerk webhook listens for:

- `user.created`
- `user.updated`
- `user.deleted`

When a user is created or updated, the corresponding Prisma user record is created or synced. This ensures the local app database remains aligned with Clerk identity data.

### 3. Todo workflow

The dashboard displays the user’s personal todo list. A free user can typically create up to 10 tasks, while premium users have unlimited capacity. Tasks are created through the authenticated user’s session, so data is isolated per account.

### 4. Subscription purchase

The subscription page allows users to start a Stripe Checkout flow. Once successfully completed, the user’s local Prisma record is updated via Stripe webhooks, and premium access is granted in the app.

### 5. Stripe portal and account management

Users can manage their billing through the Stripe Customer Portal. This is useful for:

- reviewing billing history
- canceling a subscription
- updating payment details
- checking current plan state

## Clerk configuration

### Create a Clerk app

1. Create a new Clerk app in the Clerk dashboard.
2. Copy the publishable key and secret key.
3. Add them to your `.env` file.

### Configure authentication routes

The app expects these routes:

- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/dashboard`

These defaults are used by the Clerk configuration and the middleware redirect logic.

### Configure webhooks

Add a Clerk webhook endpoint to your Clerk dashboard:

```text
https://your-domain.com/api/webhooks/clerk
```

Subscribe to these events:

- `user.created`
- `user.updated`
- `user.deleted`

This keeps the local Prisma `User` model synchronized with identity changes in Clerk.

## Stripe configuration

### Create a product and price

In the Stripe dashboard, create a paid product and price for the premium plan. Use the price ID in `STRIPE_PRICE_ID`.

### Create webhook endpoint

Set up a Stripe webhook at:

```text
https://your-domain.com/api/webhooks/stripe
```

Subscribe to events such as:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

These events keep Prisma subscription state aligned with Stripe’s billing lifecycle.

## Database schema summary

The Prisma schema defines the main SaaS entities used by the app.

### User

Represents the authenticated user and stores local SaaS metadata.

Fields include:

- `clerkId` — unique Clerk identity reference
- `email` — primary email
- `firstName` and `lastName`
- `subscriptionStatus` — current Stripe subscription status
- `subscriptionEnd` — renewal or end date
- `cancelAtPeriodEnd` — whether cancellation is scheduled
- `stripeCustomerId` and `stripeSubscriptionId`
- relation to todos

### Todo

Represents a single task item belonging to one user.

Fields include:

- `title`
- `completed`
- `userId`
- timestamps for creation and updates

### ProcessedWebhook

Used to prevent duplicate processing of incoming webhook deliveries.

### ProcessedStripeEvent

Used to avoid reprocessing the same Stripe event ID.

## API overview

The app exposes a small set of authenticated and public HTTP endpoints:

### Public / auth routes

- `/` — landing page
- `/sign-in` — Clerk sign-in page
- `/sign-up` — Clerk sign-up page
- `/forgot-password` — password reset flow
- `/api/webhooks/clerk` — Clerk webhook endpoint
- `/api/webhooks/stripe` — Stripe webhook endpoint

### Authenticated app routes

- `/dashboard` — main task dashboard
- `/subscription` — billing and premium management page

### Backend APIs

- `GET /api/todo` — fetch the current user’s tasks
- `POST /api/todo` — create a new task
- `PATCH /api/todo/[id]` — update a task
- `DELETE /api/todo/[id]` — delete a task
- `GET /api/subscription` — fetch subscription status
- `GET /api/user` — fetch the local user record
- `POST /api/stripe/checkout` — create a Stripe Checkout session
- `POST /api/stripe/portal` — create a Stripe Customer Portal session

## Subscription and plan logic

The app’s plan logic is intentionally simple and focused on a standard SaaS pattern:

- free users are limited in how many tasks they can create
- premium users unlock unlimited tasks
- subscription state is derived from Stripe and synced to the local `User` model
- users can still manage an existing plan even if they are not yet premium

This makes it a strong foundation for a real-world SaaS app that needs billing, user identity, and personalized access control.

## Security and reliability considerations

This project includes several patterns relevant to production SaaS apps:

- signed webhook verification for both Clerk and Stripe
- idempotent processing to prevent duplicate event handling
- route protection for authenticated-only areas
- user-scoped database queries to isolate personal data
- external billing logic handled through Stripe rather than client-side trust
- support for delayed user creation and recovery from webhook latency

## Development notes

A few important behaviors to keep in mind while developing locally:

- Clerk user creation can be asynchronous, so the app retries task loading when a new account has not been synced to Prisma yet.
- Stripe subscription status must be refreshed after checkout or portal flows complete.
- The app relies heavily on environment variables being present before it can fully function.
- Prisma generated files live under `src/generated/prisma`, which are created by `npx prisma generate`.

## Troubleshooting

### User not found on dashboard

This usually means the Clerk webhook has not yet created the local user record. Try:

- refreshing the page after a few seconds
- checking the Clerk webhook history
- confirming that the webhook endpoint is live and reachable
- ensuring the `CLERK_WEBHOOK_SIGNING_SECRET` value is correct

### Subscription page does not reflect premium access

This typically means one of the following:

- the Stripe webhook has not yet fired
- the webhook secret is wrong
- the user record does not have a valid Stripe customer ID
- the database has not synchronized the subscription status

### Prisma errors

Run:

```bash
npx prisma generate
npx prisma migrate dev
```

If the database is out of sync, verify the `DATABASE_URL` and database availability.

## Deployment

This app is designed to be deployed to a platform such as Vercel, with external services configured for:

- PostgreSQL database
- Clerk app configuration
- Stripe webhooks and product pricing

Recommended deployment checklist:

- set all environment variables in the production environment
- ensure the app’s public URL matches `NEXT_PUBLIC_APP_URL`
- verify webhook endpoints are live and reachable from the internet
- run Prisma migrations in production before serving traffic

## Future enhancements

This repo is a strong starter foundation for adding:

- team workspaces and shared tasks
- advanced task filters and labels
- recurring tasks and reminders
- analytics, habit tracking, and productivity insights
- multi-plan billing tiers
- role-based access control for larger SaaS teams

## License

This project is intended as a starter application and can be adapted for your own SaaS or internal product work. If you are using it for a personal or commercial project, make sure you review the license requirements of the third-party dependencies and service providers you integrate with.

## Summary

Focura demonstrates a practical SaaS architecture in a compact, readable codebase. It shows how to combine authentication, subscription billing, personalized data, and webhook-driven synchronization in a single app using modern Next.js patterns.

Whether you are building a productivity tool, a personal workflow app, or a SaaS starter for your own product, Focura gives you a useful starting point for production-ready application patterns.
