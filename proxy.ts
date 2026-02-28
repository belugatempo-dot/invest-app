import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const authToken = process.env.AUTH_TOKEN;

  // If no AUTH_TOKEN configured, app is open
  if (!authToken) return NextResponse.next();

  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${authToken}`) return NextResponse.next();

  // Unauthorized
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 },
  );
}

export const config = {
  matcher: ["/api/thesis"],
};
