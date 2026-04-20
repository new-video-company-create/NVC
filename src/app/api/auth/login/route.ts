import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyPortalLogin,
  type PortalRole,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let role: PortalRole | null = null;
  let email = "";
  let password = "";
  try {
    const body = (await req.json()) as {
      portal?: PortalRole;
      email?: string;
      password?: string;
    };
    role = body.portal === "admin" || body.portal === "client" ? body.portal : null;
    email = typeof body.email === "string" ? body.email : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
  }

  await new Promise((resolve) => setTimeout(resolve, 250));

  if (!role || !email || !password) {
    return NextResponse.json({ ok: false, error: "Missing login fields." }, { status: 400 });
  }
  if (!verifyPortalLogin(role, email, password)) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  const token = createSessionToken(role, email);
  const redirectTo = role === "admin" ? "/admin" : "/dashboard";
  const res = NextResponse.json({ ok: true, redirectTo });
  res.cookies.set(AUTH_COOKIE, token, sessionCookieOptions());
  return res;
}
