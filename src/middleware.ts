import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/dashboard", "/admin", "/billing"];

function appHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").host;
  } catch {
    return "localhost:3000";
  }
}

function isPlatformHost(host: string) {
  return (
    host === appHost() ||
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".vercel.app")
  );
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Custom domains: creator.com/my-ebook  ->  /p/my-ebook (the page checks domain ownership)
  if (host && !isPlatformHost(host)) {
    if (pathname.startsWith("/_next") || pathname.startsWith("/api")) return NextResponse.next();
    const url = request.nextUrl.clone();
    const slugPath = pathname === "/" ? "" : pathname;
    url.pathname = `/p${slugPath}`;
    const headers = new Headers(request.headers);
    headers.set("x-custom-domain", host.toLowerCase());
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const response = NextResponse.next({ request });
  const { user } = await updateSession(request, response);

  if (!user && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    const plan = request.nextUrl.searchParams.get("plan");
    url.pathname = plan ? "/billing" : "/dashboard";
    url.search = plan ? `?plan=${encodeURIComponent(plan)}` : "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
