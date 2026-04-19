import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Public health check — never exposes the secret. */
export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.length < 8) {
    return NextResponse.json({
      ok: false,
      configured: false,
      hint: "Set STRIPE_SECRET_KEY in .env.local (local) or Vercel → Environment Variables (production).",
    });
  }
  const mode = key.startsWith("sk_test_") ? "test" : key.startsWith("sk_live_") ? "live" : "unknown";
  return NextResponse.json({
    ok: true,
    configured: true,
    mode,
  });
}
