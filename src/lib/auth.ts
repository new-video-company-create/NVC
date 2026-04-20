import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type PortalRole = "admin" | "client";

export const AUTH_COOKIE = "nvc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getAuthSecret() {
  return process.env.AUTH_SECRET || "dev-only-change-me";
}

function b64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromB64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function defaultCreds() {
  return {
    admin: {
      email: "admin@newvideocompany.com",
      password: "nvc2026",
    },
    client: {
      email: "client@newvideocompany.com",
      password: "nvc-client-2026",
    },
  } as const;
}

function getPortalCreds(role: PortalRole) {
  const d = defaultCreds();
  if (role === "admin") {
    return {
      email: normalizeEmail(process.env.NVC_ADMIN_EMAIL || d.admin.email),
      password: process.env.NVC_ADMIN_PASSWORD || d.admin.password,
    };
  }
  return {
    email: normalizeEmail(process.env.NVC_CLIENT_EMAIL || d.client.email),
    password: process.env.NVC_CLIENT_PASSWORD || d.client.password,
  };
}

export function verifyPortalLogin(role: PortalRole, email: string, password: string) {
  const creds = getPortalCreds(role);
  const emailOk = safeEqual(normalizeEmail(email), creds.email);
  const passOk = safeEqual(password, creds.password);
  return emailOk && passOk;
}

export function createSessionToken(role: PortalRole, email: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role,
    email: normalizeEmail(email),
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token?: string | null): { role: PortalRole; email: string } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!safeEqual(sign(body), sig)) return null;
  try {
    const payload = JSON.parse(fromB64url(body)) as {
      role: PortalRole;
      email: string;
      exp: number;
    };
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "admin" && payload.role !== "client") return null;
    return { role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
