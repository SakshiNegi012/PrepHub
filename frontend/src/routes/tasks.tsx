import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Clock, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* Route metadata is now supplied by index.html.
  head: () => ({
    meta: [
      { title: "Tasks — PrepHub" },
      { name: "description", content: "Every small commitment across your goals, tracked in one list." },
    ],
  }),
  component: TasksPage,
});

*/
type Tab = "all" | "todo" | "in_progress" | "completed";

export default function TasksPage() {
  const store = useAppStore();
  const ui = useAppUi();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");

  const filtered = store.tasks.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    if (goalFilter !== "all" && t.goalId !== goalFilter) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <PageHeader
          eyebrow="Commitments"
          title="Tasks"
          description="Every small step across your goals. Group by goal or keep it standalone."
          actions={
            <button
              onClick={() => ui.openTaskDialog()}
              className="inline-flex items-center gap-2 rounded-full bg-forest text-page px-4 py-2.5 text-sm font-medium hover:bg-forest-soft transition-colors"
            >
              <Plus className="size-4" /> New task
            </button>
          }
        />

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks"
              className="w-full pl-9 pr-3 py-2 rounded-md bg-surface ring-1 ring-hairline text-sm focus:outline-none focus:ring-ink/20"
            />
          </div>
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="rounded-md bg-surface ring-1 ring-hairline px-3 py-2 text-sm"
          >
            <option value="all">All goals</option>
            {store.goals.map((g) => (
              <option key={g._id} value={g._id}>{g.title}</option>
            ))}
          </select>
          <div className="flex gap-1">
            {(["all", "todo", "in_progress", "completed"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                  tab === t ? "bg-ink text-page" : "text-ink-muted hover:bg-surface-sunken",
                )}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <ul className="rounded-2xl bg-surface ring-1 ring-hairline divide-y divide-hairline overflow-hidden">
          {filtered.length === 0 && (
            <li className="p-10 text-center text-sm text-ink-faint">No tasks match your filters.</li>
          )}
          {filtered.map((t) => (
            <li key={t._id} className="flex items-center gap-3 px-5 py-3.5">
              <button
                onClick={() => store.toggleTask(t._id)}
                className={cn(
                  "size-5 rounded-full border grid place-items-center shrink-0 transition-colors",
                  t.status === "completed" ? "bg-forest border-forest text-page" : "border-ink-faint/60 hover:border-forest",
                )}
                aria-label="Toggle complete"
              />
              <button
                onClick={() => ui.openTaskDialog(t)}
                className="flex-1 min-w-0 text-left"
              >
                <p className={cn("text-sm font-medium truncate", t.status === "completed" && "line-through text-ink-faint")}>
                  {t.title}
                </p>
                <div className="text-[11px] text-ink-faint mt-0.5 flex items-center gap-3">
                  {t.goalTitle && <span>{t.goalTitle}</span>}
                  {t.estimatedMinutes && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {t.estimatedMinutes}m
                    </span>
                  )}
                  {t.dueDate && <span>Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                </div>
              </button>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
                  t.priority === "high" && "bg-peach text-peach-ink",
                  t.priority === "medium" && "bg-sky text-sky-ink",
                  t.priority === "low" && "bg-surface-sunken text-ink-muted",
                )}
              >
                {t.priority}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-md hover:bg-surface-sunken text-ink-muted">
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => ui.openTaskDialog(t)}>
                    <Pencil className="size-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      ui.confirm({
                        title: `Delete "${t.title}"?`,
                        confirmText: "Delete",
                        onConfirm: () => store.deleteTask(t._id),
                      })
                    }
                  >
                    <Trash2 className="size-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
