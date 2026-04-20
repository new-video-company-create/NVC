import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0" } as const;

/** Public health check — never exposes the secret. */
export async function GET() {
  const raw = process.env.STRIPE_SECRET_KEY;
  const key = typeof raw === "string" ? raw.trim() : "";
  if (!key || key.length < 20) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        hint: "Set STRIPE_SECRET_KEY in Vercel → Settings → Environment Variables for Production, then Redeploy. Remove accidental spaces or quotes around the value.",
      },
      { headers: noStore },
    );
  }
  const mode = key.startsWith("sk_test_")
    ? "test"
    : key.startsWith("sk_live_")
      ? "live"
      : "unknown";
  return NextResponse.json(
    {
      ok: true,
      configured: true,
      mode,
    },
    { headers: noStore },
  );
}
