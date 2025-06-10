import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

const publicPaths = ["/sign-in", "/sign-up", "/"];

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (publicPaths.some(path => req.nextUrl.pathname === path)) {
    return NextResponse.next();
  }

  const authObject = await auth();
  
  // If no user is signed in, redirect to sign-in
  if (!authObject.userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Type assertion for metadata
  interface UserMetadata {
    role?: string;
  }
  
  const metadata = authObject.sessionClaims?.metadata as UserMetadata | undefined;
  const role = metadata?.role;

  // If no role is assigned, redirect to sign-in
  if (!role) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Check role-based access
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.includes(role)) {
      // Redirect to their role-specific dashboard
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};