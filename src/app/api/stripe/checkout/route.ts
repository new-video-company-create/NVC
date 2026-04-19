import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { decodeInvoiceToken, snapshotToInvoice } from "@/lib/invoice-public";
import { calcInvoiceTotal, type Invoice } from "@/lib/storage";

export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const o = req.headers.get("origin");
  if (o) return o.replace(/\/$/, "");
  const ref = req.headers.get("referer");
  if (ref) {
    try {
      return new URL(ref).origin;
    } catch {
      /* ignore */
    }
  }
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY to the environment (e.g. Vercel → Settings → Environment Variables).",
      },
      { status: 503 },
    );
  }

  let body: {
    invoiceToken?: string;
    amountCents?: number;
    invoiceNumber?: string;
    customerName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { invoiceToken, amountCents: rawCents, invoiceNumber, customerName } = body;

  let amountCents: number;
  let inv: Invoice | null = null;

  if (invoiceToken) {
    const snap = decodeInvoiceToken(invoiceToken);
    if (!snap) {
      return NextResponse.json({ error: "Invalid invoice token" }, { status: 400 });
    }
    inv = snapshotToInvoice(snap);
    const { total } = calcInvoiceTotal(inv);
    amountCents = Math.round(total * 100);
  } else {
    const n = typeof rawCents === "number" ? Math.round(rawCents) : NaN;
    if (!Number.isFinite(n) || n < 50 || n > 99999999) {
      return NextResponse.json(
        { error: "amountCents must be between 50 and 99999999 (Stripe minimum $0.50 USD), or send invoiceToken." },
        { status: 400 },
      );
    }
    amountCents = n;
  }

  if (amountCents < 50) {
    return NextResponse.json({ error: "Invoice total must be at least $0.50 USD for card checkout." }, { status: 400 });
  }

  const num = inv?.invoiceNumber ?? invoiceNumber ?? "Invoice";
  const displayName = (inv?.billToName || customerName || "Customer").slice(0, 80);

  const stripe = new Stripe(secret);
  const origin = getOrigin(req);

  const successUrl = invoiceToken
    ? `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&t=${encodeURIComponent(invoiceToken)}`
    : `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;

  const cancelUrl = invoiceToken
    ? `${origin}/i?t=${encodeURIComponent(invoiceToken)}`
    : `${origin}/dashboard/payments`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${num} — ${displayName}`.slice(0, 120),
            description: "New Video Company invoice",
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      invoice_number: num,
      ...(inv?.id ? { invoice_id: inv.id } : {}),
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
