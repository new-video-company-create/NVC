import jsPDF from "jspdf";
import { calcInvoiceTotal, FMT, type Invoice } from "./storage";
import { NVC_COMPANY, NVC_EMAIL, NVC_TAGLINE } from "./nvc-brand";

const $ = (n: number) => FMT.format(n);

export function downloadInvoicePDF(inv: Invoice) {
  const totals = calcInvoiceTotal(inv);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 56;
  const contentW = W - margin * 2;
  let y = margin;

  const white = (a: number): [number, number, number] => [255 * a, 255 * a, 255 * a];
  const accent = hexToRgb(inv.brandColor || "#ffffff");

  // Header
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), "F");

  doc.setTextColor(...accent);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(NVC_COMPANY, margin, y);
  y += 18;

  doc.setTextColor(...white(0.4));
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(NVC_EMAIL, margin, y);
  y += 13;
  doc.text(NVC_TAGLINE, margin, y);
  y += 24;

  // Divider
  doc.setDrawColor(...white(0.08));
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 24;

  // Invoice details row
  const colW = contentW / 3;
  drawField(doc, margin, y, "INVOICE NO", inv.invoiceNumber, white);
  drawField(doc, margin + colW, y, "ISSUE DATE", formatDate(inv.date), white);
  drawField(doc, margin + colW * 2, y, "DUE DATE", inv.dueDate ? formatDate(inv.dueDate) : "Upon Receipt", white);
  y += 38;

  // Bill To
  drawField(doc, margin, y, "BILL TO", inv.billToName || "—", white);
  y += 18;
  doc.setTextColor(...white(0.35));
  doc.setFontSize(9);
  doc.text(inv.billToAddress || "", margin, y);
  y += 24;

  // Campaign Scope
  if (inv.campaignScope) {
    drawLabel(doc, margin, y, "CAMPAIGN SCOPE", white);
    y += 14;
    doc.setTextColor(...white(0.5));
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(inv.campaignScope, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 12;
  }

  // Table header
  doc.setDrawColor(...white(0.08));
  doc.line(margin, y, W - margin, y);
  y += 14;
  doc.setTextColor(...white(0.25));
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", margin, y);
  doc.text("QTY", margin + contentW * 0.55, y, { align: "center" });
  doc.text("RATE", margin + contentW * 0.72, y, { align: "right" });
  doc.text("AMOUNT", W - margin, y, { align: "right" });
  y += 6;
  doc.setDrawColor(...white(0.06));
  doc.line(margin, y, W - margin, y);
  y += 16;

  // Line items
  doc.setFont("helvetica", "normal");
  const items = inv.lineItems.filter((li) => li.description);
  for (const li of items) {
    doc.setTextColor(...white(0.6));
    doc.setFontSize(9.5);
    const descLines = doc.splitTextToSize(li.description, contentW * 0.5);
    doc.text(descLines, margin, y);

    doc.setTextColor(...white(0.4));
    doc.text(String(li.quantity), margin + contentW * 0.55, y, { align: "center" });
    doc.text($(parseFloat(li.rate) || 0), margin + contentW * 0.72, y, { align: "right" });

    doc.setTextColor(...white(0.8));
    doc.setFont("helvetica", "bold");
    doc.text($(parseFloat(li.amount) || 0), W - margin, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += descLines.length * 13 + 4;
    doc.setDrawColor(...white(0.03));
    doc.line(margin, y, W - margin, y);
    y += 12;
  }

  y += 6;

  // Totals
  const totalsX = W - margin - 180;

  doc.setFontSize(9.5);
  doc.setTextColor(...white(0.3));
  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(...white(0.6));
  doc.text($(totals.subtotal), W - margin, y, { align: "right" });
  y += 16;

  if (inv.discountEnabled && totals.discount > 0) {
    doc.setTextColor(...white(0.3));
    doc.text("Discount", totalsX, y);
    doc.setTextColor(231, 111, 81);
    doc.text(`-${$(totals.discount)}`, W - margin, y, { align: "right" });
    y += 16;
  }

  if (inv.taxEnabled) {
    doc.setTextColor(...white(0.3));
    doc.text(`${inv.taxLabel} (${inv.taxRate}%)`, totalsX, y);
    doc.setTextColor(...white(0.6));
    doc.text($(totals.tax), W - margin, y, { align: "right" });
    y += 16;
  }

  // Total line
  y += 4;
  doc.setDrawColor(...white(0.1));
  doc.line(totalsX, y, W - margin, y);
  y += 18;
  doc.setTextColor(...accent);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FINAL TOTAL DUE", totalsX, y);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text($(totals.total), W - margin, y, { align: "right" });
  y += 30;

  // Notes
  if (inv.notes) {
    doc.setFillColor(255 * 0.02, 255 * 0.02, 255 * 0.02);
    doc.roundedRect(margin, y, contentW, 44, 6, 6, "F");
    drawLabel(doc, margin + 12, y + 15, "NOTES", white);
    doc.setTextColor(...white(0.4));
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(inv.notes, margin + 12, y + 28);
    y += 58;
  }

  // Payment
  y += 8;
  doc.setDrawColor(...white(0.06));
  doc.line(margin, y, W - margin, y);
  y += 18;
  drawLabel(doc, margin, y, "PAYMENT", white);
  y += 16;

  doc.setFontSize(8.5);
  doc.setTextColor(...white(0.45));
  doc.setFont("helvetica", "normal");
  const payLines = doc.splitTextToSize(
    "Card payments: use the public invoice link from NVC Portal (Stripe Checkout). ACH / wire: available on request.",
    contentW,
  );
  doc.text(payLines, margin, y);
  y += payLines.length * 12 + 8;

  // Footer
  y += 8;
  doc.setTextColor(...white(0.15));
  doc.setFontSize(7.5);
  doc.text(`Questions: ${NVC_EMAIL}`, W / 2, y, { align: "center" });

  doc.save(`Invoice-${inv.invoiceNumber}-${inv.billToName?.replace(/\s+/g, "_") || "NVC"}.pdf`);
}

function drawLabel(doc: jsPDF, x: number, y: number, text: string, white: (a: number) => [number, number, number]) {
  doc.setTextColor(...white(0.25));
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setCharSpace(1.5);
  doc.text(text, x, y);
  doc.setCharSpace(0);
}

function drawField(doc: jsPDF, x: number, y: number, label: string, value: string, white: (a: number) => [number, number, number]) {
  drawLabel(doc, x, y, label, white);
  doc.setTextColor(...white(0.8));
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  doc.text(value, x, y + 15);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}
