import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = new URL("/login", url.origin);
  const res = NextResponse.redirect(target);
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
