import type { Invoice, InvoiceLineItem } from "@/lib/storage";

/** URL-safe payload for `/i?t=` (read-only invoice view + Stripe amount). */
export type PublicInvoiceSnapshot = {
  v: 1;
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billToName: string;
  billToAddress: string;
  campaignScope: string;
  lineItems: InvoiceLineItem[];
  notes: string;
  brandColor: string;
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string;
  discountEnabled: boolean;
  discountType: "percent" | "flat";
  discountValue: number;
};

export function invoiceToSnapshot(inv: Invoice): PublicInvoiceSnapshot {
  return {
    v: 1,
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    date: inv.date,
    dueDate: inv.dueDate,
    billToName: inv.billToName,
    billToAddress: inv.billToAddress,
    campaignScope: inv.campaignScope,
    lineItems: inv.lineItems,
    notes: inv.notes,
    brandColor: inv.brandColor,
    taxEnabled: inv.taxEnabled,
    taxRate: inv.taxRate,
    taxLabel: inv.taxLabel,
    discountEnabled: inv.discountEnabled,
    discountType: inv.discountType,
    discountValue: inv.discountValue,
  };
}

export function snapshotToInvoice(s: PublicInvoiceSnapshot): Invoice {
  return {
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    date: s.date,
    dueDate: s.dueDate,
    billToName: s.billToName,
    billToAddress: s.billToAddress,
    campaignScope: s.campaignScope,
    lineItems: s.lineItems,
    notes: s.notes,
    status: "pending",
    taxEnabled: s.taxEnabled,
    taxRate: s.taxRate,
    taxLabel: s.taxLabel,
    discountEnabled: s.discountEnabled,
    discountType: s.discountType,
    discountValue: s.discountValue,
    brandColor: s.brandColor,
    createdAt: s.date,
  };
}

function utf8ToBase64(s: string): string {
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(s)));
  }
  return Buffer.from(s, "utf-8").toString("base64");
}

function base64ToUtf8(b64: string): string {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const standard = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof window !== "undefined") {
    return decodeURIComponent(escape(atob(standard)));
  }
  return Buffer.from(standard, "base64").toString("utf-8");
}

export function encodeInvoiceToken(snapshot: PublicInvoiceSnapshot): string {
  return utf8ToBase64(JSON.stringify(snapshot))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeInvoiceToken(token: string): PublicInvoiceSnapshot | null {
  try {
    const raw = base64ToUtf8(token.trim());
    const parsed = JSON.parse(raw) as PublicInvoiceSnapshot;
    if (parsed?.v !== 1 || !parsed.invoiceNumber) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function publicInvoiceUrl(token: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const q = encodeURIComponent(token);
  return `${base}/i?t=${q}`;
}
