import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ChevronRight, Pencil, Trash2, Plus, Play, ListChecks } from "lucide-react";
import { AppShell, PageHeader, SectionLabel } from "@/components/app-shell";
import { ProgressBar } from "@/components/prep/progress-bar";
import { ResourceIcon } from "@/components/prep/resource-icon";
import { useAppStore } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/goals/$goalId")({
  component: GoalDetail,
});

function GoalDetail() {
  const { goalId } = useParams({ from: "/goals/$goalId" });
  const store = useAppStore();
  const ui = useAppUi();
  const goal = store.goals.find((g) => g._id === goalId);

  if (!goal) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-16">
          <p className="text-ink-muted">This goal doesn't exist.</p>
          <Link to="/goals" className="text-sm underline mt-3 inline-block">Back to goals</Link>
        </div>
      </AppShell>
    );
  }

  const goalTasks = store.tasks.filter((t) => t.goalId === goal._id);
  const goalResources = store.resources.filter((r) => r.goalId === goal._id);
  const doneTasks = goalTasks.filter((t) => t.status === "completed").length;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <nav className="mb-6 text-xs text-ink-faint">
          <Link to="/goals" className="hover:text-ink">Goals</Link>
          <span className="mx-2 opacity-40">/</span>
          <span className="text-ink-muted">{goal.title}</span>
        </nav>

        <PageHeader
          eyebrow={goal.category}
          title={goal.title}
          description={goal.description}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => ui.openSessionDialog({ goalId: goal._id, goalTitle: goal.title, topic: goal.title })}
                className="inline-flex items-center gap-2 rounded-full bg-forest text-page px-4 py-2 text-sm font-medium hover:bg-forest-soft"
              >
                <Play className="size-4" /> Study
              </button>
              <button
                onClick={() => ui.openGoalDialog(goal)}
                className="inline-flex items-center gap-2 rounded-full ring-1 ring-hairline px-3.5 py-2 text-sm hover:bg-surface-sunken"
              >
                <Pencil className="size-4" /> Edit
              </button>
              <button
                onClick={() =>
                  ui.confirm({
                    title: `Delete "${goal.title}"?`,
                    confirmText: "Delete",
                    onConfirm: () => {
                      store.deleteGoal(goal._id);
                      window.history.back();
                    },
                  })
                }
                className="p-2 rounded-full ring-1 ring-hairline text-ink-muted hover:bg-surface-sunken"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          }
        />

        <div className="mb-10 rounded-xl bg-surface ring-1 ring-hairline p-6">
          <div className="flex items-baseline justify-between mb-3">
            <SectionLabel>Overall progress</SectionLabel>
            <span className="text-sm text-ink-muted">{goal.progress}%</span>
          </div>
          <ProgressBar value={goal.progress} />
          <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
            <Stat label="Modules" value={goal.modules.length} />
            <Stat label="Tasks" value={`${doneTasks}/${goalTasks.length}`} />
            <Stat label="Resources" value={goalResources.length} />
            <Stat label="Deadline" value={new Date(goal.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-10">
          <div className="flex items-baseline justify-between mb-5">
            <SectionLabel>Roadmap</SectionLabel>
            <span className="text-xs text-ink-faint">Modules → Topics → Concepts</span>
          </div>

          {goal.modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-ink-faint">
              This goal has no modules yet. Roadmap items are managed from your backend.
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-hairline">
              {goal.modules.map((mod) => (
                <li key={mod._id} className="py-6">
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h3 className="font-serif text-2xl">{mod.title}</h3>
                    <span className="text-xs text-ink-muted">{mod.progress}%</span>
                  </div>
                  <ProgressBar value={mod.progress} tone="muted" />

                  {mod.topics.length > 0 && (
                    <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mod.topics.map((topic) => (
                        <li key={topic._id} className="rounded-lg bg-surface-sunken/50 ring-1 ring-hairline px-4 py-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{topic.title}</span>
                            <span className="text-xs text-ink-faint">{topic.concepts.length} concepts</span>
                          </div>
                          {topic.concepts.length > 0 && (
                            <ul className="mt-3 flex flex-col gap-1.5">
                              {topic.concepts.map((c) => (
                                <li key={c._id}>
                                  <Link
                                    to="/concept/$conceptId"
                                    params={{ conceptId: c._id }}
                                    className="flex items-center justify-between gap-2 text-sm text-ink-muted hover:text-ink py-1"
                                  >
                                    <span className="truncate">{c.title}</span>
                                    <span className="flex items-center gap-2 text-xs text-ink-faint shrink-0">
                                      {c.progress}%
                                      <ChevronRight className="size-3" />
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tasks & Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <section className="rounded-xl bg-surface ring-1 ring-hairline p-5">
            <div className="flex items-baseline justify-between mb-3">
              <SectionLabel>Tasks</SectionLabel>
              <button
                onClick={() => ui.openTaskDialog(undefined, { goalId: goal._id, goalTitle: goal.title } as any)}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>
            {goalTasks.length === 0 && <p className="text-sm text-ink-faint py-4">No tasks yet.</p>}
            <ul className="flex flex-col divide-y divide-hairline">
              {goalTasks.slice(0, 8).map((t) => (
                <li key={t._id} className="flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => store.toggleTask(t._id)}
                    className={cn(
                      "size-4 rounded border grid place-items-center shrink-0",
                      t.status === "completed" ? "bg-forest border-forest text-page" : "border-ink-faint/60",
                    )}
                  />
                  <span className={cn("text-sm flex-1", t.status === "completed" && "line-through text-ink-faint")}>
                    {t.title}
                  </span>
                  <span className="text-[10px] uppercase text-ink-faint">{t.priority}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-surface ring-1 ring-hairline p-5">
            <div className="flex items-baseline justify-between mb-3">
              <SectionLabel>Resources</SectionLabel>
              <button
                onClick={() => ui.openResourceDialog(undefined, { goalId: goal._id, goalTitle: goal.title } as any)}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>
            {goalResources.length === 0 && <p className="text-sm text-ink-faint py-4">No resources saved.</p>}
            <ul className="flex flex-col gap-2">
              {goalResources.slice(0, 6).map((r) => (
                <li
                  key={r._id}
                  className="flex items-center gap-3 rounded-lg bg-surface-sunken/50 px-3 py-2"
                >
                  <ResourceIcon type={r.type} size="sm" />
                  <span className="text-sm truncate flex-1">{r.title}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Recent progress */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <SectionLabel>Recent sessions</SectionLabel>
            <Link to="/sessions" className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">
              <ListChecks className="size-3.5" /> All sessions
            </Link>
          </div>
          <ul className="rounded-xl bg-surface ring-1 ring-hairline divide-y divide-hairline overflow-hidden">
            {store.progressLogs.filter((p) => p.goalTitle === goal.title).slice(0, 4).map((p) => (
              <li key={p._id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1 truncate">{p.title}</span>
                <span className="font-mono text-xs text-ink-muted">{p.durationMinutes}m</span>
              </li>
            ))}
            {store.progressLogs.filter((p) => p.goalTitle === goal.title).length === 0 && (
              <li className="px-4 py-5 text-sm text-ink-faint text-center">No sessions logged for this goal yet.</li>
            )}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-ink-faint uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-serif text-xl">{value}</p>
    </div>
  );
}
