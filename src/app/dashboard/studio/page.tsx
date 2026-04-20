"use client";

import { useCallback, useMemo, useState } from "react";
import {
  deleteLead,
  deleteVideoProject,
  getLeads,
  getShotChecklist,
  getVideoProjects,
  saveLead,
  saveVideoProject,
  setShotChecklistItem,
  SHOT_DAY_DEFAULTS,
  type Lead,
  type LeadStage,
  type VideoProject,
  type VideoProjectStatus,
} from "@/lib/studio-storage";

const STATUS_ORDER: VideoProjectStatus[] = [
  "concept",
  "preprod",
  "shoot",
  "post",
  "delivered",
];

const STATUS_LABEL: Record<VideoProjectStatus, string> = {
  concept: "Concept",
  preprod: "Pre-prod",
  shoot: "Shoot",
  post: "Post",
  delivered: "Delivered",
};

const LEAD_STAGES: LeadStage[] = [
  "inquiry",
  "treatment",
  "proposal",
  "won",
  "lost",
];

const LEAD_LABEL: Record<LeadStage, string> = {
  inquiry: "Inquiry",
  treatment: "Treatment",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

function newId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function StudioPage() {
  const [projects, setProjects] = useState<VideoProject[]>(() => getVideoProjects());
  const [leads, setLeads] = useState<Lead[]>(() => getLeads());
  const [checklist, setChecklist] = useState(() => getShotChecklist());
  const [form, setForm] = useState({
    title: "",
    client: "",
    dueDate: "",
    status: "concept" as VideoProjectStatus,
    budgetNote: "",
    notes: "",
  });
  const [leadForm, setLeadForm] = useState({
    name: "",
    company: "",
    email: "",
    stage: "inquiry" as LeadStage,
    notes: "",
  });

  const refreshProjects = useCallback(() => setProjects(getVideoProjects()), []);
  const refreshLeads = useCallback(() => setLeads(getLeads()), []);

  const addProject = () => {
    if (!form.title.trim()) return;
    const p: VideoProject = {
      id: newId(),
      title: form.title.trim(),
      client: form.client.trim() || "—",
      dueDate: form.dueDate || new Date().toISOString().split("T")[0],
      status: form.status,
      budgetNote: form.budgetNote.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    saveVideoProject(p);
    refreshProjects();
    setForm({
      title: "",
      client: "",
      dueDate: "",
      status: "concept",
      budgetNote: "",
      notes: "",
    });
  };

  const addLead = () => {
    if (!leadForm.name.trim()) return;
    const l: Lead = {
      id: newId(),
      name: leadForm.name.trim(),
      company: leadForm.company.trim(),
      email: leadForm.email.trim(),
      stage: leadForm.stage,
      notes: leadForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    saveLead(l);
    refreshLeads();
    setLeadForm({
      name: "",
      company: "",
      email: "",
      stage: "inquiry",
      notes: "",
    });
  };

  const updateProjectStatus = (id: string, status: VideoProjectStatus) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    saveVideoProject({ ...p, status });
    refreshProjects();
  };

  const updateLeadStage = (id: string, stage: LeadStage) => {
    const l = leads.find((x) => x.id === id);
    if (!l) return;
    saveLead({ ...l, stage });
    refreshLeads();
  };

  const toggleCheck = (key: string) => {
    const next = !checklist[key];
    setShotChecklistItem(key, next);
    setChecklist(getShotChecklist());
  };

  const byStatus = useMemo(() => {
    const m = new Map<VideoProjectStatus, VideoProject[]>();
    for (const s of STATUS_ORDER) m.set(s, []);
    for (const p of projects) {
      const list = m.get(p.status) ?? [];
      list.push(p);
      m.set(p.status, list);
    }
    return m;
  }, [projects]);

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f0a14] via-[#1a1024] to-[#120c18] p-8 shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f97316]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-500/15 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f97316]">
          Studio ops
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Production board & pipeline
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Track active edits, shoots, and new business in one place. Data stays in this
          browser until you wire a database — perfect for a lean crew.
        </p>
      </header>

      {/* Kanban */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Active productions</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {STATUS_ORDER.map((status) => (
            <div
              key={status}
              className="flex flex-col rounded-xl border border-white/10 bg-zinc-900/40 p-3"
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {STATUS_LABEL[status]}
                </span>
                <span className="text-xs text-zinc-500">
                  {(byStatus.get(status) ?? []).length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {(byStatus.get(status) ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm"
                  >
                    <p className="font-medium text-white">{p.title}</p>
                    <p className="text-xs text-zinc-500">{p.client}</p>
                    <p className="mt-1 text-xs text-zinc-400">Due {p.dueDate}</p>
                    {p.budgetNote ? (
                      <p className="mt-1 text-xs text-[#f97316]/90">{p.budgetNote}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {STATUS_ORDER.filter((s) => s !== p.status).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateProjectStatus(p.id, s)}
                          className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/10 hover:text-white"
                        >
                          → {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        deleteVideoProject(p.id);
                        refreshProjects();
                      }}
                      className="mt-2 text-[10px] text-red-400/80 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6">
          <h2 className="text-lg font-semibold text-white">New production</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Add a job — it appears on the board above.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 sm:col-span-2"
              placeholder="Project title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              placeholder="Client"
              value={form.client}
              onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
            <select
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as VideoProjectStatus }))
              }
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              placeholder="Budget note (optional)"
              value={form.budgetNote}
              onChange={(e) => setForm((f) => ({ ...f, budgetNote: e.target.value }))}
            />
            <textarea
              className="sm:col-span-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              placeholder="Notes — deliverables, aspect ratios, music clearances…"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <button
            type="button"
            onClick={addProject}
            className="mt-4 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-black hover:bg-[#ea580c]"
          >
            Add to board
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6">
          <h2 className="text-lg font-semibold text-white">Shot day checklist</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Tick items before you roll. Syncs to this device only.
          </p>
          <ul className="mt-4 space-y-2">
            {SHOT_DAY_DEFAULTS.map((label) => {
              const key = label;
              const done = !!checklist[key];
              return (
                <li key={key}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-black/20 p-3 hover:border-white/10">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleCheck(key)}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black text-[#f97316]"
                    />
                    <span
                      className={
                        done ? "text-sm text-zinc-500 line-through" : "text-sm text-zinc-200"
                      }
                    >
                      {label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Leads */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6">
        <h2 className="text-lg font-semibold text-white">New business pipeline</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Lightweight CRM for inbound video + marketing leads.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 lg:col-span-1"
            placeholder="Contact name"
            value={leadForm.name}
            onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            placeholder="Company"
            value={leadForm.company}
            onChange={(e) => setLeadForm((f) => ({ ...f, company: e.target.value }))}
          />
          <input
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            placeholder="Email"
            value={leadForm.email}
            onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
          />
          <select
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={leadForm.stage}
            onChange={(e) =>
              setLeadForm((f) => ({ ...f, stage: e.target.value as LeadStage }))
            }
          >
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {LEAD_LABEL[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addLead}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            Add lead
          </button>
          <textarea
            className="sm:col-span-2 lg:col-span-5 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            placeholder="Notes — scope, budget range, references…"
            rows={2}
            value={leadForm.notes}
            onChange={(e) => setLeadForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="pb-2 pr-4 font-medium">Contact</th>
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Stage</th>
                <th className="pb-2 font-medium">Notes</th>
                <th className="pb-2 pl-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    No leads yet. Add your first inquiry above.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 text-zinc-300">
                    <td className="py-3 pr-4 font-medium text-white">{l.name}</td>
                    <td className="py-3 pr-4">{l.company || "—"}</td>
                    <td className="py-3 pr-4">
                      <select
                        className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                        value={l.stage}
                        onChange={(e) =>
                          updateLeadStage(l.id, e.target.value as LeadStage)
                        }
                      >
                        {LEAD_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {LEAD_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="max-w-xs truncate py-3 text-xs text-zinc-500">
                      {l.notes || "—"}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          deleteLead(l.id);
                          refreshLeads();
                        }}
                        className="text-xs text-red-400/80 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
