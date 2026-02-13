import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@/types/roles";

export default withAuth(
  async function middleware(req) {
    const nextauth = req.nextauth ?? {};
    const role = nextauth?.token?.role as UserRole | null;

    const url = req.nextUrl.clone();
    const pathname = url.pathname;

    // Require auth for owner and onboarding
    const needsAuth =
      pathname.startsWith("/owner") || pathname.startsWith("/onboarding");

    // If not authenticated and visiting protected, kick to /login
    if (needsAuth && !nextauth?.token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // If authenticated but no role yet, force /onboarding (except on that page or api to set role)
    if (nextauth?.token && !role) {
      const allow =
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/api/me/role") ||
        pathname.startsWith("/api/auth");
      if (!allow) {
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }

    // If user has a role and tries to access onboarding, redirect to appropriate page
    if (nextauth?.token && role && pathname.startsWith("/onboarding")) {
      if (role === "OWNER") {
        url.pathname = "/owner";
      } else if (role === "CLIENT") {
        url.pathname = "/client";
      }
      return NextResponse.redirect(url);
    }

    // Owner-only guard
    if (pathname.startsWith("/owner") && role !== "OWNER") {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  { callbacks: { authorized: () => true } }
);

export const config = {
  matcher: ["/owner/:path*", "/onboarding", "/api/me/role"],
};
