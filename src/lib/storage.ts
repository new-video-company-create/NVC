export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: string;
  amount: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billToName: string;
  billToAddress: string;
  campaignScope: string;
  lineItems: InvoiceLineItem[];
  notes: string;
  status: "draft" | "pending" | "paid";
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string;
  discountEnabled: boolean;
  discountType: "percent" | "flat";
  discountValue: number;
  brandColor: string;
  createdAt: string;
}

export interface Artist {
  id: string;
  name: string;
  stageName: string;
  genre: string;
  email: string;
  phone: string;
  instagram: string;
  spotify: string;
  website: string;
  bio: string;
  monthlyListeners?: string;
  followers?: number;
  popularity?: number;
  spotifyImageUrl?: string;
  spotifyId?: string;
  topTracks?: string[];
  imageUrl?: string;
  status: "active" | "prospect" | "onboarding";
  onboardingStep?: "contact" | "call_scheduled" | "proposal_sent" | "signed";
  createdAt: string;
}

const INVOICES_KEY = "nvc_invoices";
const ARTISTS_KEY = "nvc_artists";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getInvoices(): Invoice[] {
  return getItem<Invoice[]>(INVOICES_KEY, defaultInvoices);
}

export function getInvoiceById(id: string): Invoice | undefined {
  return getInvoices().find((i) => i.id === id);
}

export function saveInvoice(invoice: Invoice) {
  const invoices = getInvoices();
  const idx = invoices.findIndex((i) => i.id === invoice.id);
  if (idx >= 0) {
    invoices[idx] = invoice;
  } else {
    invoices.unshift(invoice);
  }
  setItem(INVOICES_KEY, invoices);
  backupToSheet("invoices", invoices);
}

export function deleteInvoice(id: string) {
  const invoices = getInvoices().filter((i) => i.id !== id);
  setItem(INVOICES_KEY, invoices);
}

export function getArtists(): Artist[] {
  return getItem<Artist[]>(ARTISTS_KEY, defaultArtists);
}

export function saveArtist(artist: Artist) {
  const artists = getArtists();
  const idx = artists.findIndex((a) => a.id === artist.id);
  if (idx >= 0) {
    artists[idx] = artist;
  } else {
    artists.unshift(artist);
  }
  setItem(ARTISTS_KEY, artists);
  backupToSheet("artists", artists);
}

export function calcSubtotal(items: InvoiceLineItem[]) {
  return items.reduce((s, li) => s + (parseFloat(li.amount.replace(/[^0-9.-]/g, "")) || 0), 0);
}

export function calcInvoiceTotal(inv: Invoice) {
  const sub = calcSubtotal(inv.lineItems);
  let discount = 0;
  if (inv.discountEnabled) {
    discount = inv.discountType === "percent" ? sub * (inv.discountValue / 100) : inv.discountValue;
  }
  const afterDiscount = sub - discount;
  const tax = inv.taxEnabled ? afterDiscount * (inv.taxRate / 100) : 0;
  return { subtotal: sub, discount, tax, total: afterDiscount + tax };
}

export const FMT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export async function backupToSheet(sheetName: string, data: unknown[]) {
  const webhookUrl = typeof window !== "undefined" ? localStorage.getItem("nvc_sheets_webhook") : null;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet: sheetName, data }),
    });
  } catch { /* silent */ }
}

function makeDefaultInvoice(overrides: Partial<Invoice> & { id: string; invoiceNumber: string }): Invoice {
  return {
    date: "", dueDate: "", billToName: "", billToAddress: "", campaignScope: "",
    lineItems: [], notes: "Please Double Check Invoice is Accurate! Payment is due upon receipt.",
    status: "draft", taxEnabled: false, taxRate: 0, taxLabel: "Sales Tax",
    discountEnabled: false, discountType: "percent", discountValue: 0,
    brandColor: "#ffffff", createdAt: new Date().toISOString(), ...overrides,
  };
}

const defaultInvoices: Invoice[] = [
  makeDefaultInvoice({
    id: "inv-003", invoiceNumber: "2026-003", date: "2026-04-07", dueDate: "2026-04-21",
    billToName: "Create Music Group", billToAddress: "1320 North Wilton Place, Los Angeles, CA, 90028",
    campaignScope: "Execution of the P!NK Marketing Campaign, including TikTok influencer campaign, Spotify promotional campaigns, and applicable reimbursements.",
    lineItems: [
      { description: "Rare Fruit Marketing — TikTok influencer campaign + Spotify Promo Campaign", quantity: 1, rate: "3000", amount: "3000" },
      { description: 'Spotify Marquee "P!NK" Reimbursement', quantity: 1, rate: "500", amount: "500" },
    ],
    status: "pending", createdAt: "2026-04-07T00:00:00Z",
  }),
  makeDefaultInvoice({
    id: "inv-002", invoiceNumber: "2026-002", date: "2026-03-28", dueDate: "2026-04-11",
    billToName: "Atlantic Records", billToAddress: "1633 Broadway, New York, NY 10019",
    campaignScope: "Social Media Campaign Q1",
    lineItems: [{ description: "Social Media Campaign Q1 — Full service", quantity: 1, rate: "4200", amount: "4200" }],
    status: "paid", createdAt: "2026-03-28T00:00:00Z",
  }),
  makeDefaultInvoice({
    id: "inv-001", invoiceNumber: "2026-001", date: "2026-03-15", dueDate: "2026-03-29",
    billToName: "Sony Music", billToAddress: "25 Madison Ave, New York, NY 10010",
    campaignScope: "Spotify Playlist Promotion",
    lineItems: [{ description: "Spotify Playlist Promotion — 4 week campaign", quantity: 1, rate: "2800", amount: "2800" }],
    status: "paid", createdAt: "2026-03-15T00:00:00Z",
  }),
];

const defaultArtists: Artist[] = [
  {
    id: "artist-saego", name: "Saego", stageName: "Saego", genre: "Hip-Hop / R&B",
    email: "", phone: "", instagram: "https://www.instagram.com/1saego/", spotify: "", website: "",
    bio: "Rising artist blending melodic hip-hop with R&B influences. Building a strong following through authentic storytelling and viral social media presence.",
    monthlyListeners: "—", status: "active", createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "artist-shockface", name: "Shöckface", stageName: "Shöckface", genre: "Electronic / Bass",
    email: "", phone: "", instagram: "", spotify: "", website: "https://shockfacemusic.com",
    bio: "Electronic producer and DJ known for heavy bass music and genre-bending productions. Creator of the HYPERWAVE brand. Releases include Helium ft. Lauren Martinez, EXÖDIA, and the SPLITTING EP.",
    monthlyListeners: "—",
    topTracks: ["Helium ft. Lauren Martinez", "EXÖDIA ft. 8Ö8", "I Will Survive", "HEADSHÖT", "QÜICKSAND"],
    status: "active", createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "artist-kidtrunks", name: "Kid Trunks", stageName: "Kid Trunks", genre: "Hip-Hop / Rap",
    email: "", phone: "", instagram: "https://www.instagram.com/kidtrunks/", spotify: "", website: "",
    bio: "South Florida rapper and member of Members Only collective. Known for his association with XXXTENTACION and Ski Mask the Slump God. Brings raw energy and versatility to every track.",
    monthlyListeners: "—", status: "active", createdAt: "2025-11-01T00:00:00Z",
  },
];
