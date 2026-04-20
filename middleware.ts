import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "nvc_session";

type PortalRole = "admin" | "client";

function getAuthSecret() {
  return process.env.AUTH_SECRET || "dev-only-change-me";
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(value: string) {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function verifySessionToken(token?: string | null): Promise<{ role: PortalRole } | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expected = bytesToBase64Url(new Uint8Array(signed));
  if (!safeEqual(expected, sig)) return null;

  try {
    const payload = JSON.parse(base64UrlToUtf8(body)) as {
      role: PortalRole;
      exp: number;
    };
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "admin" && payload.role !== "client") return null;
    return { role: payload.role };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySessionToken(req.cookies.get(AUTH_COOKIE)?.value);

  const isLogin = pathname === "/login";
  const isAdmin = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard");

  if (!isLogin && !isAdmin && !isDashboard) return NextResponse.next();

  if (!session) {
    if (isLogin) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = session.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isAdmin && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isDashboard && session.role !== "client" && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/dashboard/:path*"],
};
