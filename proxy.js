import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import aj, { authRateLimit } from "./lib/arcjet";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/how-it-works(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/marketplace(.*)",
  "/sitemap.xml",
  "/robots.txt",
  "/.well-known(.*)",
]);


export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // SEO + crawler-safe bypass routes
  if (
    path === "/" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path.startsWith("/about") ||
    path.startsWith("/how-it-works") ||
    path.startsWith("/marketplace") ||
    path.startsWith("/.well-known")
  ) {
    return NextResponse.next();
  }

  // Arcjet Security Layer
  if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
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

  // Clerk Authentication
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
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

