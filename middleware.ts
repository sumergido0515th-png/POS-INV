import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PREFIXES = ["/inventory", "/users", "/settings", "/reports"];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const isAdminOnly = ADMIN_ONLY_PREFIXES.some((p) => path.startsWith(p));
    if (isAdminOnly && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/pos", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pos/:path*",
    "/inventory/:path*",
    "/sales/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/reports/:path*",
  ],
};
