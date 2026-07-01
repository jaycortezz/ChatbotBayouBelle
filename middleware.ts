import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * HTTP Basic Auth for the admin dashboard. The browser shows a native
 * login prompt; the username is ignored, the password must match
 * ADMIN_PASSWORD.
 */
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse(
      "Admin dashboard is disabled: set the ADMIN_PASSWORD environment variable.",
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const suppliedPassword = decoded.slice(decoded.indexOf(":") + 1);
      if (suppliedPassword === password) {
        return NextResponse.next();
      }
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}
