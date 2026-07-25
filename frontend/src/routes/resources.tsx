import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Star, ExternalLink, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ResourceIcon } from "@/components/prep/resource-icon";
import { useAppStore } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";
import type { ResourceType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — PrepHub" },
      { name: "description", content: "Every video, PDF, link and note you've saved, in one library." },
    ],
  }),
  component: ResourcesPage,
});

const FILTERS: { label: string; value: ResourceType | "all" | "favorite" }[] = [
  { label: "All", value: "all" },
  { label: "Favorites", value: "favorite" },
  { label: "Videos", value: "video" },
  { label: "PDFs", value: "pdf" },
  { label: "Docs", value: "doc" },
  { label: "Websites", value: "link" },
  { label: "GitHub", value: "repo" },
  { label: "Notes", value: "note" },
];

function ResourcesPage() {
  const store = useAppStore();
  const ui = useAppUi();
  const [filter, setFilter] = useState<ResourceType | "all" | "favorite">("all");

  useEffect(() => {
    void store.loadResources();
  }, [store]);
  const [q, setQ] = useState("");

  const filtered = store.resources.filter((r) => {
    if (filter === "favorite") { if (!r.favorite) return false; }
    else if (filter !== "all" && r.type !== filter) return false;
    if (q && !r.title.toLowerCase().includes(q.toLowerCase()) && !r.tags.join(" ").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <PageHeader
          eyebrow="Library"
          title="Resources"
          description="Every video, PDF, link and note you've saved. Nothing scattered across bookmarks and drives."
          actions={
            <button
              onClick={() => ui.openResourceDialog()}
              className="inline-flex items-center gap-2 rounded-full bg-forest text-page px-4 py-2.5 text-sm font-medium hover:bg-forest-soft transition-colors"
            >
              <Plus className="size-4" /> Add resource
            </button>
          }
        />

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search resources or tags"
              className="w-full pl-9 pr-3 py-2 rounded-md bg-surface ring-1 ring-hairline text-sm placeholder:text-ink-faint focus:outline-none focus:ring-ink/20"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  filter === f.value ? "bg-ink text-page" : "text-ink-muted hover:bg-surface-sunken",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <li key={r._id} className="group relative flex items-start gap-4 rounded-lg bg-surface ring-1 ring-hairline p-4 hover:ring-ink/15 transition-shadow">
              <ResourceIcon type={r.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => ui.openResourceDialog(r)} className="text-sm font-medium leading-snug text-left hover:text-forest">
                    {r.title}
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => store.toggleFavorite(r._id)} aria-label="Favorite">
                      <Star className={cn("size-4", r.favorite ? "fill-ink text-ink" : "text-ink-faint")} strokeWidth={1.5} />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-surface-sunken text-ink-muted"><MoreHorizontal className="size-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => ui.openResourceDialog(r)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            ui.confirm({
                              title: `Delete "${r.title}"?`,
                              confirmText: "Delete",
                              onConfirm: () => store.deleteResource(r._id),
                            })
                          }
                        >
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                  {r.goalTitle && <span>{r.goalTitle}</span>}
                  {r.tags.slice(0, 2).map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink ml-auto">
                      Open <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-hairline p-12 text-center text-sm text-ink-faint">
            No resources match your search.
          </div>
        )}
      </div>
    </AppShell>
  );
}
