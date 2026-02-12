import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "str_admin_session";

function validateToken(token: string): boolean {
  if (!token || !token.includes(".")) return false;
  const parts = token.split(".");
  return parts.length === 2 && parts[0].length > 10 && parts[1].length === 64;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect /admin routes (auth check)
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(AUTH_COOKIE)?.value;
    if (!session || !validateToken(session)) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect write API routes (POST, PUT, DELETE)
  const isProtectedApi =
    ((pathname.startsWith("/api/orders") || pathname.startsWith("/api/settings") || pathname.startsWith("/api/parts")) &&
    request.method !== "GET") ||
    pathname.startsWith("/api/export") ||
    pathname.startsWith("/api/auth/change-password");

  if (isProtectedApi) {
    const session = request.cookies.get(AUTH_COOKIE)?.value;
    if (!session || !validateToken(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/orders/:path*", "/api/settings/:path*", "/api/parts/:path*", "/api/export/:path*", "/api/auth/change-password"],
};
