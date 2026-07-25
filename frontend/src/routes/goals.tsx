import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ProgressBar } from "@/components/prep/progress-bar";
import { useAppStore, type Goal } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals — PrepHub" },
      {
        name: "description",
        content: "Every learning goal you're working toward, in one calm view.",
      },
    ],
  }),
  component: GoalsPage,
});

const statusTone: Record<string, string> = {
  active: "bg-sage text-forest",
  paused: "bg-peach text-peach-ink",
  completed: "bg-sky text-sky-ink",
};

function GoalsPage() {
  const store = useAppStore();
  const ui = useAppUi();

  useEffect(() => {
    void store.loadGoals();
  }, [store]);

  const grouped = {
    active: store.goals.filter((g) => g.status === "active"),
    paused: store.goals.filter((g) => g.status === "paused"),
    completed: store.goals.filter((g) => g.status === "completed"),
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <PageHeader
          eyebrow="Your journey"
          title="Goals"
          description="Every learning goal you're working toward. Open one to explore its modules, topics and concepts."
          actions={
            <button
              onClick={() => ui.openGoalDialog()}
              className="inline-flex items-center gap-2 rounded-full bg-forest text-page px-4 py-2.5 text-sm font-medium hover:bg-forest-soft transition-colors"
            >
              <Plus className="size-4" /> New goal
            </button>
          }
        />

        {(["active", "paused", "completed"] as const).map((status) =>
          grouped[status].length ? (
            <section key={status} className="mb-10">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-4">
                {status}
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped[status].map((g) => (
                  <li key={g._id}>
                    <GoalCard goal={g} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}

        {store.goals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-hairline p-12 text-center">
            <p className="font-serif text-2xl">No goals yet</p>
            <p className="text-sm text-ink-muted mt-2">
              Set your first goal to start building your roadmap.
            </p>
            <button
              onClick={() => ui.openGoalDialog()}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest text-page px-4 py-2.5 text-sm font-medium"
            >
              <Plus className="size-4" /> Create your first goal
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function GoalCard({ goal: g }: { goal: Goal }) {
  const ui = useAppUi();
  const store = useAppStore();
  return (
    <div className="relative rounded-2xl bg-surface ring-1 ring-hairline p-5 hover:ring-forest/25 transition-shadow h-full">
      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md hover:bg-surface-sunken text-ink-muted"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => ui.openGoalDialog(g)}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                ui.confirm({
                  title: `Delete "${g.title}"?`,
                  description: "This will also remove tasks linked to this goal.",
                  confirmText: "Delete",
                  onConfirm: () => store.deleteGoal(g._id),
                })
              }
            >
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Link to="/goals/$goalId" params={{ goalId: g._id }} className="block">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="min-w-0">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                statusTone[g.status],
              )}
            >
              {g.category}
            </span>
            <h3 className="font-serif text-xl mt-2 leading-tight">{g.title}</h3>
          </div>
          <span className="font-mono text-sm text-forest">{g.progress}%</span>
        </div>
        <p className="text-sm text-ink-muted mt-3 line-clamp-2">{g.description}</p>
        <ProgressBar value={g.progress} className="mt-5" />
        <div className="mt-3 flex items-center justify-between text-[11px] text-ink-faint">
          <span>{g.modules.length} modules</span>
          <span>
            Due{" "}
            {new Date(g.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      </Link>
    </div>
  );
}
