import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Star, ExternalLink, Plus, Clock } from "lucide-react";
import { AppShell, SectionLabel } from "@/components/app-shell";
import { ProgressBar } from "@/components/prep/progress-bar";
import { BreadcrumbPath } from "@/components/prep/breadcrumb-path";
import { ResourceIcon } from "@/components/prep/resource-icon";
import { getConceptById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import type { Concept } from "@/lib/mock-data";

export const Route = createFileRoute("/concept/$conceptId")({
  loader: ({ params }): { concept: Concept } => {
    const concept = getConceptById(params.conceptId);
    if (!concept) throw notFound();
    return { concept };
  },
  component: ConceptWorkspace,
});

const TABS = ["Resources", "Notes", "Tasks"] as const;
type Tab = (typeof TABS)[number];

function ConceptWorkspace() {
  const { concept } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("Resources");

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-14 ph-fade-in">
        <nav className="mb-6 text-xs text-ink-faint">
          <Link to="/goals" className="hover:text-ink">Goals</Link>
          <span className="mx-2 opacity-40">/</span>
          <Link
            to="/goals/$goalId"
            params={{ goalId: concept.goalId }}
            className="hover:text-ink"
          >
            {concept.goalTitle}
          </Link>
        </nav>

        <header className="mb-10">
          <BreadcrumbPath
            items={[concept.goalTitle, concept.moduleTitle, concept.topicTitle]}
          />
          <div className="mt-3 flex items-start justify-between gap-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Concept workspace
              </span>
              <h1 className="mt-2 font-serif text-4xl md:text-5xl leading-[1.05]">
                {concept.title}
              </h1>
              <p className="mt-3 text-ink-muted max-w-[56ch] text-pretty">
                {concept.summary}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main content */}
          <div className="lg:col-span-8 min-w-0">
            <div className="flex gap-6 border-b border-hairline mb-6">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "pb-3 -mb-px text-sm transition-colors",
                    tab === t
                      ? "text-ink border-b-2 border-ink font-medium"
                      : "text-ink-faint hover:text-ink border-b-2 border-transparent",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "Resources" && (
              <div className="flex flex-col gap-3">
                {concept.resources.length === 0 && (
                  <EmptyState label="No resources yet. Save a video, PDF or link to start." />
                )}
                {concept.resources.map((r: import("@/lib/mock-data").Resource) => (
                  <div
                    key={r._id}
                    className="group flex items-start gap-4 rounded-lg bg-surface ring-1 ring-hairline p-4 hover:ring-ink/15 transition-shadow"
                  >
                    <ResourceIcon type={r.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-snug">{r.title}</p>
                        <Star
                          className={cn(
                            "size-4 shrink-0",
                            r.favorite
                              ? "fill-ink text-ink"
                              : "text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity",
                          )}
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                        <span className="uppercase tracking-wider">{r.type}</span>
                        {r.tags.map((t: string) => (
                          <span key={t}>#{t}</span>
                        ))}
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-ink ml-auto"
                          >
                            Open <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button className="mt-2 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink self-start">
                  <Plus className="size-4" /> Add resource
                </button>
              </div>
            )}

            {tab === "Notes" && (
              <article className="rounded-lg bg-surface ring-1 ring-hairline p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
                  {concept.notes || "No notes yet. Start writing what you learn as you go."}
                </pre>
              </article>
            )}

            {tab === "Tasks" && (
              <ul className="flex flex-col gap-2">
                {concept.tasks.length === 0 && (
                  <EmptyState label="No tasks for this concept yet." />
                )}
                {concept.tasks.map((t: import("@/lib/mock-data").Task) => (
                  <li
                    key={t._id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg bg-surface ring-1 ring-hairline px-4 py-3",
                      t.status === "completed" && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "size-4 rounded border shrink-0 grid place-items-center",
                        t.status === "completed"
                          ? "bg-ink border-ink"
                          : "border-ink-faint/60",
                      )}
                    >
                      {t.status === "completed" && (
                        <svg
                          className="size-2.5 text-page"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          t.status === "completed" && "line-through",
                        )}
                      >
                        {t.title}
                      </p>
                      {t.estimatedMinutes && (
                        <p className="text-xs text-ink-faint mt-0.5 flex items-center gap-1">
                          <Clock className="size-3" /> {t.estimatedMinutes} min
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-ink-faint">
                      {t.priority}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right rail */}
          <aside className="lg:col-span-4 lg:sticky lg:top-8 self-start">
            <div className="rounded-xl bg-surface-sunken/60 ring-1 ring-hairline p-6">
              <SectionLabel>Progress</SectionLabel>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-4xl">{concept.progress}</span>
                <span className="text-sm text-ink-muted">/ 100</span>
              </div>
              <ProgressBar value={concept.progress} className="mt-3" />

              <div className="mt-6 pt-6 border-t border-hairline space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink-faint">Time spent</p>
                  <p className="mt-1 text-sm">
                    {Math.floor(concept.timeSpentMinutes / 60)}h{" "}
                    {concept.timeSpentMinutes % 60}m
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink-faint">Last opened</p>
                  <p className="mt-1 text-sm">{formatRelative(concept.lastOpenedAt)}</p>
                </div>
              </div>

              <button className="mt-6 w-full bg-ink text-page rounded-md py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors">
                Start focused session
              </button>
              <button className="mt-2 w-full text-ink-muted text-xs py-1 hover:text-ink">
                Mark concept complete
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline p-8 text-center text-sm text-ink-faint">
      {label}
    </div>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
