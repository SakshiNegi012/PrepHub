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
import {
  ArrowUpRight,
  Plus,
  Target,
  Clock,
  FolderPlus,
  StickyNote,
  Timer,
  Check,
  Flame,
  TrendingUp,
  ListChecks,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/prep/progress-bar";
import { useAppStore } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrepHub — Your study desk" },
      {
        name: "description",
        content:
          "PrepHub is your calm study desk. Continue where you left off, focus on today, and watch your journey grow.",
      },
    ],
  }),
  component: Home,
});

const cardTones = [
  { bg: "bg-peach", dot: "bg-clay", bar: "peach" as const },
  { bg: "bg-sky", dot: "bg-sky-ink", bar: "sky" as const },
  { bg: "bg-sage", dot: "bg-forest", bar: "sage" as const },
];

function Home() {
  const store = useAppStore();
  const ui = useAppUi();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const continueCards = store.concepts.slice(0, 3);
  const activeGoals = store.goals.filter((g) => g.status === "active");
  const pendingTasks = store.tasks.filter((t) => t.status !== "completed").slice(0, 4);
  const doneTasks = store.tasks.filter((t) => t.status === "completed");
  const focusPct = pendingTasks.length
    ? Math.round((doneTasks.length / (pendingTasks.length + doneTasks.length)) * 100)
    : 0;
  const streakDays = getStreakDays(store.progressLogs);

  const weekMinutes = store.progressLogs
    .filter((p) => Date.now() - new Date(p.date).getTime() < 7 * 86400e3)
    .reduce((a, p) => a + p.durationMinutes, 0);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <header className="flex items-start justify-between gap-6 mb-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {today}
            </p>
            <h1 className="mt-2 font-serif text-4xl md:text-[2.75rem] leading-[1.05]">
              {greeting}, {store.user.name.split(" ")[0]}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {pendingTasks.length} task{pendingTasks.length === 1 ? "" : "s"} left for today.
            </p>
          </div>
          <button
            onClick={() => ui.openSessionDialog()}
            className="inline-flex items-center gap-2 rounded-full bg-forest text-page px-4 py-2.5 text-sm font-medium hover:bg-forest-soft transition-colors"
          >
            <Timer className="size-4" strokeWidth={2} />
            Start Session
          </button>
        </header>

        {/* Weekly progress summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <SummaryTile
            icon={Clock}
            label="Study this week"
            value={`${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`}
          />
          <SummaryTile icon={Check} label="Tasks completed" value={String(doneTasks.length)} />
          <SummaryTile icon={Target} label="Active goals" value={String(activeGoals.length)} />
          <SummaryTile
            icon={Flame}
            label="Current streak"
            value={streakDays > 0 ? `${streakDays}d` : "0d"}
            tone="flame"
          />
        </section>

        {/* Continue Learning */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">Continue Learning</h2>
            <Link
              to="/goals"
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
            >
              All courses <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {continueCards.map((c, i) => {
              const tone = cardTones[i % cardTones.length];
              return (
                <Link
                  key={c._id}
                  to="/concept/$conceptId"
                  params={{ conceptId: c._id }}
                  className={cn(
                    "group block rounded-2xl p-5 min-h-[180px] flex-col flex justify-between transition-transform hover:-translate-y-0.5",
                    tone.bg,
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className={cn("size-2 rounded-full", tone.dot)} />
                    <span className="font-mono text-[11px] text-ink-muted">
                      {formatRelative(c.lastOpenedAt)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl leading-tight text-ink">{c.title}</h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {c.moduleTitle} — {c.topicTitle}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-ink-muted mb-1.5">
                      <span>Progress</span>
                      <span className="font-medium text-ink">{c.progress}%</span>
                    </div>
                    <ProgressBar value={c.progress} tone={tone.bar} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Focus + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
          <section className="lg:col-span-2 rounded-2xl bg-surface ring-1 ring-hairline p-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="font-serif text-2xl">Today's Focus</h2>
              <span className="font-mono text-xs text-ink-muted">
                {doneTasks.length} / {pendingTasks.length + doneTasks.length}
              </span>
            </div>
            <ProgressBar value={focusPct} className="mb-5" />
            <ul className="flex flex-col divide-y divide-hairline">
              {pendingTasks.length === 0 && (
                <li className="py-6 text-center text-sm text-ink-faint">
                  All caught up. Add a task to focus on.
                </li>
              )}
              {pendingTasks.map((t) => (
                <li key={t._id} className="flex items-center gap-3 py-3">
                  <button
                    onClick={() => store.toggleTask(t._id)}
                    className="size-5 shrink-0 rounded-full border border-ink-faint/60 hover:border-forest grid place-items-center transition-colors"
                    aria-label="Mark complete"
                  />
                  <button
                    onClick={() => ui.openTaskDialog(t)}
                    className="flex-1 text-left text-sm hover:text-forest transition-colors"
                  >
                    {t.title}
                  </button>
                  <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] text-ink-muted">
                    {(t.goalTitle ?? "Free").split(" ").slice(-1)[0]}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => ui.openTaskDialog()}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-hairline py-2.5 text-sm text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <Plus className="size-4" /> Add a focus task
            </button>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-2.5">
              <QuickAction
                icon={Target}
                label="New Learning Goal"
                tone="sage"
                onClick={() => ui.openGoalDialog()}
              />
              <QuickAction
                icon={Clock}
                label="Log Study Session"
                tone="sky"
                onClick={() => ui.openSessionDialog()}
              />
              <QuickAction
                icon={FolderPlus}
                label="Save a Resource"
                tone="peach"
                onClick={() => ui.openResourceDialog()}
              />
              <QuickAction
                icon={ListChecks}
                label="Add a Task"
                tone="forest"
                onClick={() => ui.openTaskDialog()}
              />
              <QuickAction
                icon={StickyNote}
                label="Write a Note"
                tone="peach"
                onClick={() => ui.openResourceDialog(undefined, { type: "note" })}
              />
              <QuickAction icon={TrendingUp} label="View Journey" tone="sky" to="/journey" />
            </div>
          </section>
        </div>

        {/* Active Goals */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl">Active Goals</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => ui.openGoalDialog()}
                className="inline-flex items-center gap-1 rounded-full bg-ink text-page px-3 py-1.5 text-xs font-medium hover:bg-ink/90 transition-colors"
              >
                <Plus className="size-3.5" /> New goal
              </button>
              <Link
                to="/goals"
                className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1"
              >
                Manage goals <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((g) => (
              <li key={g._id}>
                <Link
                  to="/goals/$goalId"
                  params={{ goalId: g._id }}
                  className="block rounded-2xl bg-surface ring-1 ring-hairline p-5 hover:ring-forest/25 transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                        {g.category}
                      </span>
                      <h3 className="font-serif text-xl mt-1 leading-tight">{g.title}</h3>
                    </div>
                    <span className="font-mono text-sm text-forest">{g.progress}%</span>
                  </div>
                  <ProgressBar value={g.progress} className="mt-4" />
                  <div className="mt-3 flex items-center justify-between text-[11px] text-ink-faint">
                    <span>{g.modules.length} modules</span>
                    <span>
                      Due{" "}
                      {new Date(g.deadline).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  tone?: "flame";
}) {
  return (
    <div className="rounded-xl bg-surface ring-1 ring-hairline px-4 py-3 flex items-start justify-between gap-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
        <p className="mt-1.5 font-serif text-2xl leading-none">{value}</p>
      </div>
      <span
        className={cn(
          "grid size-8 place-items-center rounded-lg bg-surface-sunken/70 text-ink-muted",
          tone === "flame" && "text-flame",
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  tone,
  to,
  onClick,
}: {
  icon: typeof Target;
  label: string;
  tone: "sage" | "sky" | "peach" | "forest";
  to?: string;
  onClick?: () => void;
}) {
  const toneMap = {
    sage: "bg-sage text-forest",
    sky: "bg-sky text-sky-ink",
    peach: "bg-peach text-peach-ink",
    forest: "bg-forest-tint text-forest",
  };
  const inner = (
    <>
      <span className={cn("grid size-9 place-items-center rounded-lg", toneMap[tone])}>
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </>
  );
  const cls =
    "flex items-center gap-3 rounded-2xl bg-surface ring-1 ring-hairline px-4 py-3 hover:ring-forest/25 transition-shadow text-left w-full";
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
