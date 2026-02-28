import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const authToken = process.env.AUTH_TOKEN;

  // If no AUTH_TOKEN configured, app is open
  if (!authToken) return NextResponse.next();

  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${authToken}`) return NextResponse.next();

  // Check query param (useful for sharing links)
  const tokenParam = request.nextUrl.searchParams.get("token");
  if (tokenParam === authToken) return NextResponse.next();

  // Unauthorized
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 },
  );
}

export const config = {
  matcher: [
    // Match all routes except static assets and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
