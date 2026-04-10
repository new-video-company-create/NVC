"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface LineItem {
  description: string;
  amount: string;
}

export default function NewInvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState("2026-004");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [campaignScope, setCampaignScope] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", amount: "" }]);
  const [notes, setNotes] = useState("Please Double Check Invoice is Accurate! Payment is due upon receipt.");
  const [showPreview, setShowPreview] = useState(false);

  const addLineItem = () => setLineItems([...lineItems, { description: "", amount: "" }]);

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => {
    const num = parseFloat(item.amount.replace(/[^0-9.]/g, "")) || 0;
    return sum + num;
  }, 0);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors";

  const labelClass = "text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2 block";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs uppercase tracking-[0.15em] mb-3 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Invoices
          </Link>
          <h1 className="text-xl font-medium text-white/90">New Invoice</h1>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-xs uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {!showPreview ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* From (pre-filled) */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-4">From</h3>
            <div className="text-white/60 text-sm space-y-1">
              <p className="text-white/80 font-medium">Tru Management</p>
              <p>Contact: Joe Meyer | 508-864-7360 | Joe@trumgmt.org</p>
              <p>5720 Lunsford Rd. Apt. 3236, Plano, TX, 75024</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Invoice Number</label>
                <input className={inputClass} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Bill To</h3>
            <div>
              <label className={labelClass}>Company / Name</label>
              <input className={inputClass} placeholder="e.g. Create Music Group" value={billToName} onChange={(e) => setBillToName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input className={inputClass} placeholder="1320 North Wilton Place, Los Angeles, CA, 90028" value={billToAddress} onChange={(e) => setBillToAddress(e.target.value)} />
            </div>
          </div>

          {/* Campaign Scope */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Campaign Scope</h3>
            <textarea
              className={`${inputClass} min-h-[80px] resize-none`}
              placeholder="Execution of the P!NK Marketing Campaign, including TikTok influencer campaign, Spotify promotional campaigns..."
              value={campaignScope}
              onChange={(e) => setCampaignScope(e.target.value)}
            />
          </div>

          {/* Line Items */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Cost Breakdown</h3>
            {lineItems.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1">
                  <label className={labelClass}>Description</label>
                  <input
                    className={inputClass}
                    placeholder="TikTok influencer campaign + Spotify Promo"
                    value={item.description}
                    onChange={(e) => updateLineItem(i, "description", e.target.value)}
                  />
                </div>
                <div className="w-36">
                  <label className={labelClass}>Amount</label>
                  <input
                    className={inputClass}
                    placeholder="$3,000.00"
                    value={item.amount}
                    onChange={(e) => updateLineItem(i, "amount", e.target.value)}
                  />
                </div>
                {lineItems.length > 1 && (
                  <button
                    onClick={() => removeLineItem(i)}
                    className="mt-6 p-2 text-white/20 hover:text-red-400/60 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addLineItem}
              className="flex items-center gap-2 text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Line Item
            </button>

            <div className="border-t border-white/[0.06] pt-4 mt-4 flex justify-between items-center">
              <span className="text-white/40 text-sm">Subtotal / Final Total</span>
              <span className="text-white/90 text-lg font-semibold">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-2">Notes</h3>
            <textarea
              className={`${inputClass} min-h-[60px] resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Banking (pre-filled) */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-4">Banking &amp; Payment Info</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-white/25">Bank:</span> <span className="text-white/60">TD Bank</span></div>
              <div><span className="text-white/25">Account Name:</span> <span className="text-white/60">Joseph Meyer</span></div>
              <div><span className="text-white/25">Routing:</span> <span className="text-white/60">211370545</span></div>
              <div><span className="text-white/25">Account #:</span> <span className="text-white/60">00003275633359</span></div>
              <div><span className="text-white/25">Swift:</span> <span className="text-white/60">NRTHUS33XXX</span></div>
              <div><span className="text-white/25">Bank Address:</span> <span className="text-white/60">200 Boston Tpke, Shrewsbury, MA 01545</span></div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button className="flex-1 py-3.5 rounded-xl bg-white/[0.10] hover:bg-white/[0.16] text-white/90 text-sm uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer font-medium">
              Generate Invoice
            </button>
            <button className="px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/40 text-sm uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer">
              Save Draft
            </button>
          </div>
        </motion.div>
      ) : (
        /* Invoice Preview */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-8 space-y-8"
        >
          <div className="border-b border-white/[0.06] pb-6">
            <h2 className="text-white/90 text-2xl font-bold mb-1">Tru Management</h2>
            <p className="text-white/40 text-sm">Contact: Joe Meyer | 508-864-7360 | Joe@trumgmt.org</p>
            <p className="text-white/30 text-sm">5720 Lunsford Rd. Apt. 3236, Plano, TX, 75024</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Invoice No</p>
              <p className="text-white/80 text-sm font-mono">{invoiceNumber}</p>
            </div>
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Date</p>
              <p className="text-white/80 text-sm">{new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Bill To</p>
              <p className="text-white/80 text-sm">{billToName || "—"}</p>
              <p className="text-white/40 text-xs">{billToAddress || "—"}</p>
            </div>
          </div>

          {campaignScope && (
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-2">Campaign Scope</p>
              <p className="text-white/60 text-sm">{campaignScope}</p>
            </div>
          )}

          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-3">Cost Breakdown</p>
            <div className="space-y-2">
              {lineItems.filter(li => li.description).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/60">{item.description}</span>
                  <span className="text-white/80 font-medium">{item.amount}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.08] mt-4 pt-4 flex justify-between">
              <span className="text-white/60 text-sm font-medium">FINAL TOTAL DUE</span>
              <span className="text-white text-lg font-bold">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          {notes && (
            <div className="bg-white/[0.02] rounded-xl p-4">
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-1">Notes</p>
              <p className="text-white/50 text-xs">{notes}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
