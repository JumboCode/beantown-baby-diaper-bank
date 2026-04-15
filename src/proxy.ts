import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isSuperAdminOnlyRoute = createRouteMatcher(["/admin/controls(.*)"]);

const isSignInRoute = createRouteMatcher(["/admin/sign-in(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAdminApiRoute = createRouteMatcher([
  "/api/admin(.*)",
  "/api/partners",
  "/api/partners/percentages(.*)",
  "/api/distributions(.*)",
  "/api/geocode(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isSignInRoute(req)) {
    return;
  }

  if (!(isAdminRoute(req) || isAdminApiRoute(req) || isSuperAdminOnlyRoute(req))) {
    return;
  }

  const { sessionClaims, userId } = await auth();
  const role = sessionClaims?.metadata?.role;

  if (!userId) {
    if (isAdminApiRoute(req) || isSuperAdminOnlyRoute(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signInUrl = new URL("/admin/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (isSuperAdminOnlyRoute(req)) {
    if (role !== "superadmin") {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (role !== "admin" && role !== "superadmin") {
    if (isAdminApiRoute(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL("/unauthorized", req.url);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
