import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
    "/",
    "/sign-up",
    "/sign-in",
    "/api/webhook/register",
]);

const AUTHENTICATED_REDIRECT_PATHS = new Set(["/", "/sign-up", "/sign-in"]);

const redirectToSignIn = (request: NextRequest) =>
    new Response(null, {
        status: 307,
        headers: {
            location: new URL("/sign-in", request.url).toString(),
        },
    });

const redirectToDashboard = (request: NextRequest) =>
    new Response(null, {
        status: 307,
        headers: {
            location: new URL("/dashboard", request.url).toString(),
        },
    });

export default clerkMiddleware(async (auth, request) => {
    const { userId } = await auth();
    const pathname = new URL(request.url).pathname;

    // Skip auth checks for API routes - let them handle auth and return 401
    if (pathname.startsWith("/api/")) {
        return;
    }

    // If not signed in, allow only public paths
    if (!userId) {
        if (!PUBLIC_PATHS.has(pathname)) {
            return redirectToSignIn(request);
        }
        return;
    }

    // If signed in, redirect from auth pages to dashboard
    if (AUTHENTICATED_REDIRECT_PATHS.has(pathname)) {
        return redirectToDashboard(request);
    }

    // Allow access to all other routes when authenticated
    return;
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/__clerk/:path*",
        "/(api|trpc)(.*)",
    ],
};
