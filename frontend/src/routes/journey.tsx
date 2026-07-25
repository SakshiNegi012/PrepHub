import { createFileRoute, Link } from "@tanstack/react-router";

function getStreakDays(progressLogs: Array<{ date: string }>) {
  const uniqueDays = new Set(
    progressLogs
      .map((p) => new Date(p.date))
      .filter((d) => !Number.isNaN(d.getTime()))
      .map((d) => d.toISOString().slice(0, 10)),
  );

  if (uniqueDays.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getBestStreak(progressLogs: Array<{ date: string }>) {
  const days = Array.from(
    new Set(
      progressLogs
        .map((p) => new Date(p.date))
        .filter((d) => !Number.isNaN(d.getTime()))
        .map((d) => d.toISOString().slice(0, 10)),
    ),
  ).sort();

  if (days.length === 0) return 0;

  let best = 0;
  let current = 0;
  let prev: Date | null = null;

  for (const day of days) {
    const currentDate = new Date(day);
    if (prev && (currentDate.getTime() - prev.getTime()) / 86400e3 === 1) {
      current += 1;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
    prev = currentDate;
  }

  return best;
}
import { Flame, Plus, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ResourceIcon } from "@/components/prep/resource-icon";
import { useAppStore } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Journey — PrepHub" },
      {
        name: "description",
        content: "Your learning journey — a 12-week look at what you've done.",
      },
    ],
  }),
  component: JourneyPage,
});

function buildHeatmap(progressLogs: Array<{ date: string; durationMinutes: number }>) {
  const weeks = 12;
  const cells: number[][] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const minutesByDay = new Map<string, number>();
  for (const item of progressLogs) {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + item.durationMinutes);
  }

  for (let day = 0; day < 7; day++) {
    const row: number[] = [];
    for (let week = 0; week < weeks; week++) {
      const cursor = new Date(start);
      cursor.setDate(start.getDate() + week * 7 + day);
      const key = cursor.toISOString().slice(0, 10);
      const minutes = minutesByDay.get(key) ?? 0;
      const value = minutes >= 180 ? 3 : minutes >= 60 ? 2 : minutes > 0 ? 1 : 0;
      row.push(value);
    }
    cells.push(row);
  }

  return cells;
}

function JourneyPage() {
  const store = useAppStore();
  const heatmap = buildHeatmap(store.progressLogs);
  const totalCells = heatmap.flat().length;
  const activeCells = heatmap.flat().filter((c) => c > 0).length;
  const consistency = Math.round((activeCells / totalCells) * 100);
  const streakDays = getStreakDays(store.progressLogs);
  const bestStreak = getBestStreak(store.progressLogs);

  const monthMinutes = store.progressLogs
    .filter((p) => Date.now() - new Date(p.date).getTime() < 30 * 86400e3)
    .reduce((a, p) => a + p.durationMinutes, 0);

  const upcoming = [...store.goals]
    .filter((g) => g.status === "active")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const todaysFocus = store.tasks.filter((t) => t.status !== "completed").slice(0, 3);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Heatmap card — compact */}
          <section className="lg:col-span-2 rounded-2xl bg-surface ring-1 ring-hairline p-6">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="font-serif text-2xl">Learning Journey</h1>
                <p className="text-sm text-ink-faint mt-0.5">Past 12 weeks</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                <Flame className="size-4 text-flame" strokeWidth={2.2} />
                {streakDays > 0 ? `${streakDays} day streak` : "No streak yet"}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-1">
              {heatmap.map((row, i) => (
                <div key={i} className="flex gap-1">
                  {row.map((v, j) => (
                    <span
                      key={j}
                      className={cn(
                        "size-2.5 rounded-sm",
                        v === 0 && "bg-surface-sunken",
                        v === 1 && "bg-sage",
                        v === 2 && "bg-forest/60",
                        v === 3 && "bg-forest",
                      )}
                      title={`Intensity ${v}`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-ink-faint">
              <div className="flex items-center gap-3">
                <Legend swatch="bg-surface-sunken" label="None" />
                <Legend swatch="bg-sage" label="Light" />
                <Legend swatch="bg-forest" label="Active" />
              </div>
              <span>{activeCells} active days</span>
            </div>

            {/* Inline insights — replaces empty white space */}
            <div className="mt-5 pt-5 border-t border-hairline grid grid-cols-2 md:grid-cols-4 gap-4">
              <Insight icon={TrendingUp} label="Consistency" value={`${consistency}%`} />
              <Insight
                icon={Calendar}
                label="This month"
                value={`${Math.floor(monthMinutes / 60)}h ${monthMinutes % 60}m`}
              />
              <Insight
                icon={Flame}
                label="Best streak"
                value={bestStreak > 0 ? `${bestStreak}d` : "0d"}
              />
              <Insight icon={Sparkles} label="Sessions" value={String(store.progressLogs.length)} />
            </div>
          </section>

          {/* Insights column — deadlines + today */}
          <section className="flex flex-col gap-4">
            <div className="rounded-2xl bg-surface ring-1 ring-hairline p-5">
              <h2 className="font-serif text-lg mb-3">Upcoming deadlines</h2>
              <ul className="flex flex-col gap-2.5">
                {upcoming.length === 0 && (
                  <li className="text-sm text-ink-faint">Nothing due soon.</li>
                )}
                {upcoming.map((g) => {
                  const days = Math.max(
                    0,
                    Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400e3),
                  );
                  return (
                    <li key={g._id}>
                      <Link
                        to="/goals/$goalId"
                        params={{ goalId: g._id }}
                        className="flex items-center justify-between gap-3 text-sm hover:text-forest"
                      >
                        <span className="truncate">{g.title}</span>
                        <span
                          className={cn(
                            "font-mono text-xs shrink-0",
                            days < 14 ? "text-clay" : "text-ink-faint",
                          )}
                        >
                          {days}d
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl bg-surface ring-1 ring-hairline p-5">
              <h2 className="font-serif text-lg mb-3">Today's focus</h2>
              <ul className="flex flex-col gap-2">
                {todaysFocus.length === 0 && (
                  <li className="text-sm text-ink-faint">All caught up.</li>
                )}
                {todaysFocus.map((t) => (
                  <li key={t._id} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 rounded-full bg-forest shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Recent activity */}
        <section className="rounded-2xl bg-surface ring-1 ring-hairline p-6 mb-10">
          <h2 className="font-serif text-2xl mb-4">Recent Activity</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {store.activities.slice(0, 8).map((a) => (
              <li key={a._id} className="flex gap-3">
                <span className="mt-1.5 size-1.5 rounded-full bg-forest shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{actionLabel(a.actionType)}</span> —{" "}
                    {a.message.replace(/^(Opened|Completed|Added|Logged|Updated|Saved) /, "")}
                  </p>
                  <p className="text-xs text-ink-faint mt-0.5">{formatWhen(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <SavedResourcesInline />
      </div>
    </AppShell>
  );
}

function SavedResourcesInline() {
  const store = useAppStore();
  const ui = useAppUi();
  const [filter, setFilter] = useState<string>("All");
  const filters = ["All", "PDFs", "Videos", "Articles", "Notes"] as const;
  const filtered = store.resources
    .filter((r) => {
      if (filter === "All") return true;
      if (filter === "PDFs") return r.type === "pdf";
      if (filter === "Videos") return r.type === "video";
      if (filter === "Articles") return r.type === "link" || r.type === "doc";
      if (filter === "Notes") return r.type === "note";
      return true;
    })
    .slice(0, 8);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl">Saved Resources</h2>
        <button
          onClick={() => ui.openResourceDialog()}
          className="inline-flex items-center gap-1.5 rounded-full bg-forest text-page px-4 py-2 text-sm font-medium hover:bg-forest-soft transition-colors"
        >
          <Plus className="size-4" /> Add Resource
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm transition-colors",
              filter === f
                ? "bg-forest text-page"
                : "text-ink-muted hover:bg-surface-sunken ring-1 ring-hairline",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2.5">
        {filtered.map((r) => (
          <li
            key={r._id}
            className="flex items-center gap-4 rounded-2xl bg-surface ring-1 ring-hairline px-4 py-3.5 hover:ring-forest/25 transition-shadow"
          >
            <ResourceIcon type={r.type} />
            <button onClick={() => ui.openResourceDialog(r)} className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-ink-faint mt-0.5">{r.goalTitle ?? "Personal"}</p>
            </button>
            {r.tags[0] && (
              <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] text-ink-muted">
                {r.tags[0]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Insight({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-faint">
        <Icon className="size-3" /> {label}
      </div>
      <p className="mt-1.5 font-serif text-2xl leading-none">{value}</p>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", swatch)} />
      {label}
    </span>
  );
}

function actionLabel(t: string) {
  const map: Record<string, string> = {
    concept_opened: "Studied",
    task_completed: "Completed",
    task_added: "Added",
    resource_added: "Saved",
    progress_logged: "Session",
    goal_updated: "Goal",
    note_saved: "Note",
    profile_updated: "Profile",
  };
  return map[t] ?? t.replace(/_/g, " ");
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  if (yest) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
