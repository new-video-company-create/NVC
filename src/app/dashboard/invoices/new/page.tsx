"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { saveInvoice, getInvoiceById, getInvoices, calcInvoiceTotal, FMT, type Invoice, type InvoiceLineItem } from "@/lib/storage";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { NVC_COMPANY, NVC_EMAIL, NVC_TAGLINE } from "@/lib/nvc-brand";

const BRAND_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Gold", value: "#D4AF37" },
  { label: "Ice Blue", value: "#A8DADC" },
  { label: "Coral", value: "#E76F51" },
  { label: "Lavender", value: "#B8A9C9" },
  { label: "Mint", value: "#2EC4B6" },
];

function InvoiceBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneFrom = searchParams.get("clone");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [campaignScope, setCampaignScope] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([{ description: "", quantity: 1, rate: "", amount: "" }]);
  const [notes, setNotes] = useState("Please Double Check Invoice is Accurate! Payment is due upon receipt.");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(8.25);
  const [taxLabel, setTaxLabel] = useState("Sales Tax");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [brandColor, setBrandColor] = useState("#ffffff");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = getInvoices();
    const nextNum = existing.length > 0
      ? `2026-${String(parseInt(existing[0].invoiceNumber.split("-")[1] || "0") + 1).padStart(3, "0")}`
      : "2026-001";
    setInvoiceNumber(nextNum);

    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDueDate(d.toISOString().split("T")[0]);

    if (cloneFrom) {
      const source = getInvoiceById(cloneFrom);
      if (source) {
        setBillToName(source.billToName);
        setBillToAddress(source.billToAddress);
        setCampaignScope(source.campaignScope);
        setLineItems(source.lineItems.length > 0 ? source.lineItems : [{ description: "", quantity: 1, rate: "", amount: "" }]);
        setNotes(source.notes);
        setTaxEnabled(source.taxEnabled);
        setTaxRate(source.taxRate);
        setTaxLabel(source.taxLabel);
        setDiscountEnabled(source.discountEnabled);
        setDiscountType(source.discountType);
        setDiscountValue(source.discountValue);
        setBrandColor(source.brandColor);
      }
    }
  }, [cloneFrom]);

  const updateLineItem = (i: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updated = [...lineItems];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[i] as any)[field] = value;
    if (field === "quantity" || field === "rate") {
      const qty = field === "quantity" ? Number(value) : updated[i].quantity;
      const rate = field === "rate" ? String(value) : updated[i].rate;
      updated[i].amount = String((qty || 1) * (parseFloat(rate.replace(/[^0-9.-]/g, "")) || 0));
    }
    setLineItems(updated);
  };

  const addLineItem = () => setLineItems([...lineItems, { description: "", quantity: 1, rate: "", amount: "" }]);
  const removeLineItem = (i: number) => { if (lineItems.length > 1) setLineItems(lineItems.filter((_, idx) => idx !== i)); };

  const buildInvoice = (status: Invoice["status"]): Invoice => ({
    id: `inv-${Date.now()}`, invoiceNumber, date, dueDate, billToName, billToAddress, campaignScope,
    lineItems: lineItems.filter((li) => li.description),
    notes, status, taxEnabled, taxRate, taxLabel, discountEnabled, discountType, discountValue, brandColor,
    createdAt: new Date().toISOString(),
  });

  const totals = calcInvoiceTotal(buildInvoice("draft"));

  const handleGenerate = () => {
    const inv = buildInvoice("pending");
    saveInvoice(inv);
    setSaved(true);
    setTimeout(() => router.push(`/dashboard/invoices?view=${inv.id}`), 600);
  };

  const handleSaveDraft = () => {
    saveInvoice(buildInvoice("draft"));
    setSaved(true);
    setTimeout(() => router.push("/dashboard/invoices"), 600);
  };

  const handleDownloadPDF = () => {
    downloadInvoicePDF(buildInvoice("pending"));
  };

  const ic = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors";
  const lc = "text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2 block";

  if (saved) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-white/90 text-lg font-medium">Invoice Saved</h2>
        <p className="text-white/30 text-sm mt-1">Redirecting...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/invoices" className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs uppercase tracking-[0.15em] mb-3 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Invoices
          </Link>
          <h1 className="text-xl font-medium text-white/90">{cloneFrom ? "Clone Invoice" : "New Invoice"}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all cursor-pointer">
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button onClick={handleDownloadPDF} className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all cursor-pointer">
            Download PDF
          </button>
        </div>
      </div>

      {!showPreview ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* From */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-4">From</h3>
            <div className="flex items-start gap-4">
              <Image src="/nvc-logo.png" alt="NVC" width={40} height={40} className="rounded-lg mt-0.5 opacity-95" />
              <div className="text-white/60 text-sm space-y-1">
                <p className="text-white/80 font-medium">{NVC_COMPANY}</p>
                <p>{NVC_TAGLINE}</p>
                <p>{NVC_EMAIL}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={lc}>Invoice #</label><input className={ic} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
              <div><label className={lc}>Issue Date</label><input type="date" className={ic} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><label className={lc}>Due Date</label><input type="date" className={ic} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            </div>
          </div>

          {/* Bill To */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Bill To</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={lc}>Company / Name</label><input className={ic} placeholder="Create Music Group" value={billToName} onChange={(e) => setBillToName(e.target.value)} /></div>
              <div><label className={lc}>Address</label><input className={ic} placeholder="1320 North Wilton Place, LA, CA 90028" value={billToAddress} onChange={(e) => setBillToAddress(e.target.value)} /></div>
            </div>
          </div>

          {/* Scope */}
          <div className="glass rounded-2xl p-6">
            <label className={lc}>Campaign Scope</label>
            <textarea className={`${ic} min-h-[70px] resize-none`} placeholder="Execution of the P!NK Marketing Campaign..." value={campaignScope} onChange={(e) => setCampaignScope(e.target.value)} />
          </div>

          {/* Line Items */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Line Items</h3>
            <div className="hidden md:grid grid-cols-12 gap-2 text-white/20 text-[10px] uppercase tracking-[0.15em] px-1">
              <span className="col-span-5">Description</span><span className="col-span-2">Qty</span><span className="col-span-2">Rate ($)</span><span className="col-span-2">Amount</span><span className="col-span-1" />
            </div>
            {lineItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input className={`${ic} col-span-12 md:col-span-5`} placeholder="Description" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} />
                <input type="number" min={1} className={`${ic} col-span-4 md:col-span-2`} value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", parseInt(e.target.value) || 1)} />
                <input className={`${ic} col-span-4 md:col-span-2`} placeholder="0.00" value={item.rate} onChange={(e) => updateLineItem(i, "rate", e.target.value)} />
                <span className="col-span-3 md:col-span-2 text-white/60 text-sm text-right pr-2">{FMT.format(parseFloat(item.amount) || 0)}</span>
                <button onClick={() => removeLineItem(i)} className="col-span-1 text-white/15 hover:text-red-400/60 transition-colors cursor-pointer justify-self-center" disabled={lineItems.length <= 1}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button onClick={addLineItem} className="flex items-center gap-2 text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Line Item
            </button>
          </div>

          {/* Tax & Discount */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-white/40 text-xs">Tax</label>
                <button onClick={() => setTaxEnabled(!taxEnabled)} className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${taxEnabled ? "bg-emerald-500/40" : "bg-white/[0.08]"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white/80 transition-transform mx-0.5 ${taxEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {taxEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={lc}>Label</label><input className={ic} value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)} /></div>
                  <div><label className={lc}>Rate %</label><input type="number" step="0.01" className={ic} value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} /></div>
                </div>
              )}
            </div>
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-white/40 text-xs">Discount</label>
                <button onClick={() => setDiscountEnabled(!discountEnabled)} className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${discountEnabled ? "bg-emerald-500/40" : "bg-white/[0.08]"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white/80 transition-transform mx-0.5 ${discountEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {discountEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={lc}>Type</label>
                    <select className={ic} value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}>
                      <option value="percent">Percentage</option><option value="flat">Flat Amount</option>
                    </select>
                  </div>
                  <div><label className={lc}>{discountType === "percent" ? "% Off" : "Amount ($)"}</label><input type="number" step="0.01" className={ic} value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} /></div>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="glass rounded-2xl p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/30">Subtotal</span><span className="text-white/60">{FMT.format(totals.subtotal)}</span></div>
              {discountEnabled && totals.discount > 0 && <div className="flex justify-between"><span className="text-white/30">Discount</span><span className="text-red-400/70">-{FMT.format(totals.discount)}</span></div>}
              {taxEnabled && <div className="flex justify-between"><span className="text-white/30">{taxLabel} ({taxRate}%)</span><span className="text-white/60">{FMT.format(totals.tax)}</span></div>}
              <div className="flex justify-between border-t border-white/[0.08] pt-3 mt-3">
                <span className="text-white/70 font-medium">Total Due</span>
                <span className="text-white text-xl font-bold">{FMT.format(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-3">Invoice Accent Color</h3>
            <div className="flex gap-2">
              {BRAND_COLORS.map((c) => (
                <button key={c.value} onClick={() => setBrandColor(c.value)} className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${brandColor === c.value ? "border-white/60 scale-110" : "border-transparent"}`} style={{ background: c.value }} title={c.label} />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="glass rounded-2xl p-6">
            <label className={lc}>Notes</label>
            <textarea className={`${ic} min-h-[60px] resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {/* Payment */}
          <div className="glass rounded-2xl p-6 border border-[#635BFF]/15">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-3">Payment</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              After you save an invoice, copy its public link from the invoice list. Clients can pay by card on that page via Stripe Checkout (test cards work in test mode).
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleGenerate} className="flex-1 py-3.5 rounded-xl bg-white/[0.10] hover:bg-white/[0.16] text-white/90 text-sm uppercase tracking-[0.15em] transition-all cursor-pointer font-medium">Generate Invoice</button>
            <button onClick={handleSaveDraft} className="px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/40 text-sm uppercase tracking-[0.15em] transition-all cursor-pointer">Save Draft</button>
          </div>
        </motion.div>
      ) : (
        <InvoicePreview invoice={buildInvoice("pending")} />
      )}
    </div>
  );
}

function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const totals = calcInvoiceTotal(invoice);
  const accent = invoice.brandColor || "#ffffff";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 space-y-7">
      <div className="flex items-start justify-between pb-6 border-b border-white/[0.06]">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: accent }}>{NVC_COMPANY}</h2>
          <p className="text-white/40 text-sm mt-1">{NVC_EMAIL}</p>
          <p className="text-white/30 text-sm">{NVC_TAGLINE}</p>
        </div>
        <Image src="/nvc-logo.png" alt="NVC" width={56} height={56} className="rounded-xl opacity-95" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Invoice</p><p className="text-white/80 text-sm font-mono">{invoice.invoiceNumber}</p></div>
        <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Date</p><p className="text-white/80 text-sm">{new Date(invoice.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
        <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Due</p><p className="text-white/80 text-sm">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Upon Receipt"}</p></div>
      </div>
      <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Bill To</p><p className="text-white/80 text-sm">{invoice.billToName || "—"}</p><p className="text-white/40 text-xs">{invoice.billToAddress}</p></div>
      {invoice.campaignScope && <div><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Scope</p><p className="text-white/60 text-sm">{invoice.campaignScope}</p></div>}
      <div>
        <div className="grid grid-cols-12 gap-2 pb-2 border-b border-white/[0.06] mb-2">
          <span className="col-span-6 text-white/25 text-[10px] uppercase tracking-[0.15em]">Description</span>
          <span className="col-span-1 text-white/25 text-[10px] uppercase tracking-[0.15em] text-center">Qty</span>
          <span className="col-span-2 text-white/25 text-[10px] uppercase tracking-[0.15em] text-right">Rate</span>
          <span className="col-span-3 text-white/25 text-[10px] uppercase tracking-[0.15em] text-right">Amount</span>
        </div>
        {invoice.lineItems.filter((li) => li.description).map((li, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 py-2 border-b border-white/[0.03]">
            <span className="col-span-6 text-white/60 text-sm">{li.description}</span>
            <span className="col-span-1 text-white/40 text-sm text-center">{li.quantity}</span>
            <span className="col-span-2 text-white/50 text-sm text-right">{FMT.format(parseFloat(li.rate) || 0)}</span>
            <span className="col-span-3 text-white/80 text-sm font-medium text-right">{FMT.format(parseFloat(li.amount) || 0)}</span>
          </div>
        ))}
        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-white/30">Subtotal</span><span className="text-white/60">{FMT.format(totals.subtotal)}</span></div>
          {invoice.discountEnabled && totals.discount > 0 && <div className="flex justify-between"><span className="text-white/30">Discount</span><span className="text-red-400/70">-{FMT.format(totals.discount)}</span></div>}
          {invoice.taxEnabled && <div className="flex justify-between"><span className="text-white/30">{invoice.taxLabel} ({invoice.taxRate}%)</span><span className="text-white/60">{FMT.format(totals.tax)}</span></div>}
          <div className="flex justify-between border-t border-white/[0.08] pt-3 mt-2">
            <span className="font-medium" style={{ color: accent }}>FINAL TOTAL DUE</span>
            <span className="text-white text-xl font-bold">{FMT.format(totals.total)}</span>
          </div>
        </div>
      </div>
      {invoice.notes && <div className="bg-white/[0.02] rounded-xl p-4"><p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Notes</p><p className="text-white/50 text-xs">{invoice.notes}</p></div>}
    </motion.div>
  );
}

export default function NewInvoicePage() {
  return <Suspense fallback={<div className="text-white/30 py-12 text-center text-sm">Loading...</div>}><InvoiceBuilder /></Suspense>;
}
