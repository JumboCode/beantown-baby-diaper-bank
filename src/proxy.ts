import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/admincontrols(.*)"]);
const isAdminApiRoute = createRouteMatcher([
  "/api/admin(.*)",
  "/api/partners",
  "/api/partners/percentages(.*)",
  "/api/distributions(.*)",
  "/api/geocode(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!(isAdminRoute(req) || isAdminApiRoute(req))) {
    return;
  }

  const authState = await auth();
  if (!authState.userId) {
    if (isAdminApiRoute(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = authState.sessionClaims?.metadata?.role;

  if (!["admin", "superadmin"].includes(role ?? "")) {
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
