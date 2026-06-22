import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle case-insensitive FAQ route
  if (pathname.toLowerCase() === "/faq" && pathname !== "/faq") {
    const url = request.nextUrl.clone();
    url.pathname = "/faq";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/FAQ", "/Faq", "/faQ", "/fAq", "/fAQ", "/FaQ", "/FAq"],
};
