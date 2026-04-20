/** Local-first tools for a small video + marketing studio (NVC portal). */

export type VideoProjectStatus = "concept" | "preprod" | "shoot" | "post" | "delivered";

export interface VideoProject {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  status: VideoProjectStatus;
  notes: string;
  /** Rough budget note, e.g. "$4.5k flat" */
  budgetNote: string;
  createdAt: string;
}

export type LeadStage = "inquiry" | "treatment" | "proposal" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  stage: LeadStage;
  notes: string;
  createdAt: string;
}

const PROJECTS_KEY = "nvc_studio_projects";
const LEADS_KEY = "nvc_studio_leads";
const CHECKLIST_KEY = "nvc_studio_shot_checklist";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

const defaultProjects: VideoProject[] = [
  {
    id: "vp-demo-1",
    title: "Artist launch spot — 60s",
    client: "Create Music Group",
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    status: "post",
    notes: "Color pass + supers. Deliver 16:9 + 9:16.",
    budgetNote: "$6k",
    createdAt: new Date().toISOString(),
  },
  {
    id: "vp-demo-2",
    title: "Social cutdowns x6",
    client: "Internal",
    dueDate: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0],
    status: "preprod",
    notes: "Hook-first edits for TikTok/Reels.",
    budgetNote: "$2.4k",
    createdAt: new Date().toISOString(),
  },
];

export function getVideoProjects(): VideoProject[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (!raw) return defaultProjects;
  try {
    return JSON.parse(raw) as VideoProject[];
  } catch {
    return defaultProjects;
  }
}

export function saveVideoProject(p: VideoProject) {
  const all = getVideoProjects().filter((x) => x.id !== p.id);
  all.unshift(p);
  setItem(PROJECTS_KEY, all);
}

export function deleteVideoProject(id: string) {
  setItem(
    PROJECTS_KEY,
    getVideoProjects().filter((x) => x.id !== id),
  );
}

export function getLeads(): Lead[] {
  return getItem<Lead[]>(LEADS_KEY, []);
}

export function saveLead(lead: Lead) {
  const all = getLeads().filter((l) => l.id !== lead.id);
  all.unshift(lead);
  setItem(LEADS_KEY, all);
}

export function deleteLead(id: string) {
  setItem(
    LEADS_KEY,
    getLeads().filter((l) => l.id !== id),
  );
}

export const SHOT_DAY_DEFAULTS = [
  "Batteries & media cards packed",
  "Call sheet sent + parking confirmed",
  "Lens kit + backup body",
  "Audio scratch + timecode sync plan",
  "Client sign-off on hero frame",
  "Hard backup before leaving location",
] as const;

export type ChecklistState = Record<string, boolean>;

export function getShotChecklist(): ChecklistState {
  return getItem<ChecklistState>(CHECKLIST_KEY, {});
}

export function setShotChecklistItem(key: string, done: boolean) {
  const cur = getShotChecklist();
  cur[key] = done;
  setItem(CHECKLIST_KEY, cur);
}
