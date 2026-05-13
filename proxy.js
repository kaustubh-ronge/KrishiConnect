import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/how-it-works",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

import aj, { authRateLimit } from "./lib/arcjet";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  // --- ARCJET PROTECTION ---
  // Protect sensitive routes from bots and brute force
  if (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up")) {
    const decision = await aj.protect(req, {
      rules: [authRateLimit],
    });

    if (decision.isDenied()) {
      if (decision.reason.isBot()) {
        return new NextResponse("Bot traffic detected", { status: 403 });
      } else if (decision.reason.isRateLimit()) {
        return new NextResponse("Too many attempts. Please try again later.", { status: 429 });
      } else {
        return new NextResponse("Access Denied", { status: 403 });
      }
    }
  }

  // --- CLERK PROTECTION ---
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific internal routes
    "/__clerk/(.*)",
  ],
};
