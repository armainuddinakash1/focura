import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

const PUBLIC_PATHS = new Set([
    "/",
    "/sign-up",
    "/sign-in",
    "/api/webhook/register",
]);

const DASHBOARD_PATH = "/dashboard";
const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

const redirectToSignIn = (request: NextRequest) =>
    Response.redirect(new URL("/sign-in", request.url), 302);

export default clerkMiddleware(async (auth, request) => {
    try {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (PUBLIC_PATHS.has(pathname)) {
            return;
        }

        const authState = await auth();
        const userId = authState.userId;
        const user = await currentUser();
        const metadata = user?.publicMetadata as
            | Record<string, unknown>
            | undefined;
        const isSignedIn = Boolean(userId);
        const isAdmin = Boolean(
            user &&
            (metadata?.role === "admin" ||
                metadata?.isAdmin === true ||
                metadata?.admin === true),
        );

        if (!isSignedIn) {
            return redirectToSignIn(request);
        }

        if (pathname === DASHBOARD_PATH && isAdmin) {
            url.pathname = ADMIN_DASHBOARD_PATH;
            return Response.redirect(url, 302);
        }

        if (pathname === ADMIN_DASHBOARD_PATH && !isAdmin) {
            url.pathname = DASHBOARD_PATH;
            return Response.redirect(url, 302);
        }

        return;
    } catch (error) {
        console.error("[middleware] auth error:", error);
        const url = new URL(request.url);
        if (PUBLIC_PATHS.has(url.pathname)) {
            return;
        }
        return redirectToSignIn(request);
    }
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/__clerk/:path*",
        "/(api|trpc)(.*)",
    ],
};
