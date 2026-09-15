# SaaS Starter App

A full-stack Next.js starter app that combines Clerk authentication, PostgreSQL persistence via Prisma, and a simple subscription-gated todo workflow. It is designed as a modern SaaS base app with user sync through Clerk webhooks, protected routes, and a premium/free-tier model.

## Overview

This project is a practical starter for building a user-based SaaS application. It includes:

- Authentication with Clerk
- Protected routes and redirect flow
- User synchronization between Clerk and Prisma
- Todo CRUD APIs secured by authenticated user identity
- Free vs premium subscription logic
- PostgreSQL database setup with Prisma ORM
- App Router-based architecture in Next.js 16

## Features

### Authentication and user management

- Sign in, sign up, and password reset pages powered by Clerk
- Middleware-based route protection
- Clerk webhook listener to create or sync local Prisma users
- Soft delete handling for deleted Clerk users

### Todo application

- Create, list, update, and delete todos
- Todos are scoped to the currently authenticated user
- Free users are limited to 3 todos
- Premium users can create unlimited todos

### Subscription model

- Users can toggle subscription status from the subscription page
- Subscription expiry is tracked with a `subscriptionEnd` timestamp
- Expired subscriptions automatically reset to inactive

### Database and data layer

- Prisma schema with `User`, `Todo`, and `ProcessedWebhook` models
- PostgreSQL connection via Prisma adapter for Postgres
- Webhook idempotency using a processed webhook table

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL
- Clerk
- Tailwind CSS
- shadcn-inspired UI primitives

## Project Structure

```bash
.
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── subscription/
│   │   │   ├── todo/
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
│   ├── context/
│   ├── lib/
│   ├── generated/
│   ├── proxy.ts
│   └── ...
├── .env.example
├── package.json
├── prisma.config.ts
├── next.config.ts
├── tsconfig.json
├── README.md
└── ...
```

## Prerequisites

Before running this project, make sure you have:

- Node.js 20+ recommended
- npm, pnpm, yarn, or bun
- PostgreSQL database instance
- Clerk account with a project created

## Environment Variables

Create a `.env` file at the project root and add the following variables:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/saas_starter_app?schema=public"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
CLERK_WEBHOOK_SIGNING_SECRET="your_clerk_webhook_signing_secret"

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

### Notes

- `DATABASE_URL` is required for Prisma and the PostgreSQL adapter.
- Clerk environment variables are required for authentication and webhook verification.
- The webhook secret must be configured in the Clerk dashboard so webhook requests can be validated.

## Database Setup

This app uses Prisma with a PostgreSQL datasource.

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Run the Prisma migrations:

```bash
npx prisma migrate dev --name init
```

If the schema is already migrated, you can also run:

```bash
npx prisma db push
```

### Prisma schema summary

The schema includes:

- `User`
    - `clerkId` unique
    - `email` unique
    - `isSubscribed` flag
    - `subscriptionEnd`
    - `deletedAt`
    - relations to todos
- `Todo`
    - `title`
    - `completed`
    - user relation
- `ProcessedWebhook`
    - stores webhook IDs for deduplication and retry-safe processing

## Clerk Configuration

### 1. Create a Clerk app

Create a new app in your Clerk dashboard and copy the publishable and secret keys.

### 2. Configure sign-in and sign-up routes

The app expects these URLs:

- `/sign-in`
- `/sign-up`
- `/dashboard` as the post-auth landing page

### 3. Configure webhook endpoint

Set up a Clerk webhook in the dashboard that points to:

```bash
https://your-domain.com/api/webhooks/clerk
```

The project listens for these events:

- `user.created`
- `user.updated`
- `user.deleted`

This syncs the local Prisma user table with Clerk user records.

## Running the Application

### Development server

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

## Authentication and Route Flow

The app uses `clerkMiddleware` in `src/proxy.ts` to enforce access rules:

- Public pages: `/`, `/sign-in`, `/sign-up`, `/forgot-password`
- Protected pages require signed-in users
- Authenticated users are redirected away from sign-in/sign-up pages to `/dashboard`
- API routes are excluded from the route-level auth guard and handle their own auth checks

## API Overview

### Todos API

#### GET /api/todo

Returns the current user's todos.

#### POST /api/todo

Creates a todo for the authenticated user.

Behavior:

- Free users can create up to 3 todos
- Paid users can create more
- Empty or invalid titles are rejected

### Subscription API

#### GET /api/subscription

Returns the authenticated user's subscription status.

#### PATCH /api/subscription

Toggles the subscription state for the current user.

Behavior:

- Accepts `{ isSubscribed: boolean }`
- Updates `isSubscribed` and `subscriptionEnd`
- Marks expired subscriptions inactive automatically

### Clerk webhook API

#### POST /api/webhooks/clerk

Receives Clerk webhook events and syncs user records with Prisma.

This endpoint is idempotent because it records each webhook delivery ID in `ProcessedWebhook`.

## Subscription Logic

The app includes a simple SaaS-style premium gate:

- Default new users are free
- Free accounts may only create 3 todos
- Premium users can upgrade with a subscription toggle
- `subscriptionEnd` is used to expire the feature after a defined period

This is intentionally lightweight and meant to be a starting point for a SaaS product.

## Examples of Common Tasks

### Create a new migration

```bash
npx prisma migrate dev --name add_feature_name
```

### View database in Prisma Studio

```bash
npx prisma studio
```

### Regenerate Prisma client

```bash
npx prisma generate
```

## Deployment Notes

This project is ready for deployment to a platform like Vercel, Render, Railway, or a custom VPS with a Postgres database.

When deploying:

- Set `DATABASE_URL` to your production database
- Configure Clerk production keys and webhook secret
- Ensure your deployment domain is allowed by the Clerk webhook
- Set environment variables in your hosting platform, not in source control

## Troubleshooting

### Prisma connection errors

Check that:

- `DATABASE_URL` is correct
- PostgreSQL is running
- credentials and hostname are valid

### Clerk auth not working

Confirm that:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- `CLERK_SECRET_KEY` is set
- the app is using the correct public URLs

### Webhooks not syncing

Make sure:

- the webhook endpoint is reachable from Clerk
- `CLERK_WEBHOOK_SIGNING_SECRET` is correct
- the endpoint is configured under the correct Clerk application

## License

This project is provided as a starter application for learning and prototyping. Add a license file if you plan to use it in production or distribute it.

## Useful Next Steps

You can extend the starter with:

- Stripe billing integration
- Role-based access control
- Admin dashboard
- Team workspaces
- Email verification
- Search and filtering for todos
- Pagination and database indexes

## Summary

This starter app is a complete foundation for a SaaS application with authentication, database-backed user identity, premium limits, and a simple todo experience. It is a strong base for extending into a larger product with billing, enterprise features, and richer business logic.
