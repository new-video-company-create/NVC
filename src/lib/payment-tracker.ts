export type TrackerCategory = "video" | "marketing";

export interface TrackerRow {
  id: string;
  category: TrackerCategory;
  description: string;
  originalAmount: number;
  dateIssued: string;
  dueDate: string;
  paymentsMadeTotal: number;
  paymentsMadeThisWeek: number;
  previousBalance: number;
  currentBalance: number;
  lateFeeWeek1: number;
  lateFeeWeek2: number;
  lateFeeWeek3: number;
  lateFeeWeek4: number;
  notes: string;
  createdAt: string;
}

const KEY = "nvc_payment_tracker_rows_v1";
export const LATE_FEE_RATE = 0.05;

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function rowId() {
  return `trk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseMoney(value: string): number {
  const cleaned = value.replace(/[$,']/g, "").trim();
  if (!cleaned) return 0;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toIsoDate(value: string) {
  const v = value.trim();
  if (!v) return "";
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  // try MM/DD/YYYY
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return "";
  const mm = m[1].padStart(2, "0");
  const dd = m[2].padStart(2, "0");
  const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${yyyy}-${mm}-${dd}`;
}

function parseTable(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  if (!lines.length) return [];
  // Prefer tab-separated content from Google Sheets copy.
  if (lines.some((l) => l.includes("\t"))) {
    return lines.map((line) => line.split("\t").map((c) => c.trim()));
  }
  // Fallback: basic CSV split.
  return lines.map((line) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        quoted = !quoted;
      } else if (ch === "," && !quoted) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  });
}

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/\s+/g, " ").trim();
}

function rowFromCells(
  category: TrackerCategory,
  headers: string[],
  cells: string[],
): TrackerRow | null {
  const idx = (name: string) => headers.findIndex((h) => normalizeHeader(h) === normalizeHeader(name));
  const descI = idx("Description");
  if (descI < 0) return null;
  const description = (cells[descI] || "").trim();
  if (!description) return null;

  const originalAmount = parseMoney(cells[idx("Original Amount")] || "");
  const dateIssued = toIsoDate(cells[idx("Date Issued")] || "");
  const dueDate = toIsoDate(cells[idx("Due Date")] || "");
  const paymentsMadeTotal = parseMoney(cells[idx("Payments Made Total")] || "");
  const paymentsMadeThisWeek = parseMoney(cells[idx("Payments Made this week")] || "");
  const previousBalance = parseMoney(cells[idx("Previous Balance")] || "");
  const currentBalance = parseMoney(cells[idx("Current Balance")] || "");
  const lateFeeWeek1 = parseMoney(cells[idx("Late Fees Week 1")] || "");
  const lateFeeWeek2 = parseMoney(cells[idx("Week 2")] || "");
  const lateFeeWeek3 = parseMoney(cells[idx("Week 3")] || "");
  const lateFeeWeek4 = parseMoney(cells[idx("Week 4")] || "");

  return {
    id: rowId(),
    category,
    description,
    originalAmount,
    dateIssued,
    dueDate,
    paymentsMadeTotal,
    paymentsMadeThisWeek,
    previousBalance,
    currentBalance,
    lateFeeWeek1,
    lateFeeWeek2,
    lateFeeWeek3,
    lateFeeWeek4,
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

export function importRowsFromSheetPaste(paste: string): TrackerRow[] {
  const table = parseTable(paste);
  if (!table.length) return [];
  const rows: TrackerRow[] = [];
  let headers: string[] = [];
  let category: TrackerCategory = "video";
  for (const line of table) {
    const normalized = line.map((c) => normalizeHeader(c));
    if (normalized.includes("description") && normalized.includes("original amount")) {
      headers = line;
      category = normalized.includes("late fees week 1") ? "marketing" : "video";
      continue;
    }
    if (!headers.length) continue;
    const row = rowFromCells(category, headers, line);
    if (row) rows.push(row);
  }
  return rows;
}

function defaultRows(): TrackerRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const dueLate = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
  const dueCurrent = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return [
    {
      id: "trk_361firm_video",
      category: "video",
      description: "361firm — principal photography + offline edit (sample row)",
      originalAmount: 1899.63,
      dateIssued: today,
      dueDate: dueLate,
      paymentsMadeTotal: 0,
      paymentsMadeThisWeek: 0,
      previousBalance: 0,
      currentBalance: 1899.63,
      lateFeeWeek1: 0,
      lateFeeWeek2: 0,
      lateFeeWeek3: 0,
      lateFeeWeek4: 0,
      notes: "Import your real weekly tabs to replace this starter row.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "trk_361firm_marketing",
      category: "marketing",
      description: "361firm — monthly marketing retainer + paid social ops (sample row)",
      originalAmount: 4200,
      dateIssued: today,
      dueDate: dueCurrent,
      paymentsMadeTotal: 1200,
      paymentsMadeThisWeek: 400,
      previousBalance: 3000,
      currentBalance: 2600,
      lateFeeWeek1: 0,
      lateFeeWeek2: 0,
      lateFeeWeek3: 0,
      lateFeeWeek4: 0,
      notes: "Marketing rows support Late Fees Week 1–4 when you paste from Sheets.",
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getTrackerRows(): TrackerRow[] {
  const rows = getItem<TrackerRow[]>(KEY, []);
  return rows.length ? rows : defaultRows();
}

export function saveTrackerRow(row: TrackerRow) {
  const rows = getTrackerRows();
  const i = rows.findIndex((r) => r.id === row.id);
  if (i >= 0) rows[i] = row;
  else rows.unshift(row);
  setItem(KEY, rows);
}

export function saveManyTrackerRows(rowsIn: TrackerRow[]) {
  const map = new Map(getTrackerRows().map((r) => [r.id, r] as const));
  for (const r of rowsIn) map.set(r.id, r);
  setItem(KEY, Array.from(map.values()));
}

export function deleteTrackerRow(id: string) {
  setItem(
    KEY,
    getTrackerRows().filter((r) => r.id !== id),
  );
}

export function clearTrackerRows() {
  setItem(KEY, []);
}

export function getLateWeeks(dueDate: string, now = new Date()) {
  if (!dueDate) return 0;
  const due = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(due.getTime())) return 0;
  const days = Math.floor((now.getTime() - due.getTime()) / 86400000);
  if (days <= 30) return 0;
  return Math.ceil((days - 30) / 7);
}

export function lateFeeFromWeeks(balance: number, weeks: number) {
  if (balance <= 0 || weeks <= 0) return 0;
  return balance * (Math.pow(1 + LATE_FEE_RATE, weeks) - 1);
}

export function manualLateFeeTotal(row: TrackerRow) {
  return row.lateFeeWeek1 + row.lateFeeWeek2 + row.lateFeeWeek3 + row.lateFeeWeek4;
}

export function amountDueNow(row: TrackerRow, now = new Date()) {
  const auto = lateFeeFromWeeks(row.currentBalance, getLateWeeks(row.dueDate, now));
  const manual = manualLateFeeTotal(row);
  return row.currentBalance + Math.max(auto, manual);
}

export function weekKey(dateIso: string) {
  if (!dateIso) return "";
  const d = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000);
  const week = Math.floor(days / 7) + 1;
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
