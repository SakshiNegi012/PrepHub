import { Play, Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";

/* Route metadata is now supplied by index.html.
  head: () => ({
    meta: [
      { title: "Sessions — PrepHub" },
      { name: "description", content: "Your study sessions, logged and reviewed." },
    ],
  }),
  component: SessionsPage,
});

*/
export default function SessionsPage() {
  const store = useAppStore();
  const ui = useAppUi();

  const grouped: Record<string, typeof store.progressLogs> = {};
  for (const p of store.progressLogs) {
    const day = new Date(p.date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    (grouped[day] ??= []).push(p);
  }
  const total = store.progressLogs.reduce((a, p) => a + p.durationMinutes, 0);
  const avg = store.progressLogs.length ? Math.round(total / store.progressLogs.length) : 0;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <PageHeader
          eyebrow="Study log"
          title="Sessions"
          description="Every focused block you've logged. Review what you worked on and how long it took."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => ui.openSessionDialog()}
                className="inline-flex items-center gap-2 rounded-full bg-forest text-page px-4 py-2.5 text-sm font-medium hover:bg-forest-soft"
              >
                <Play className="size-4" /> {store.activeSession ? "Open session" : "Start session"}
              </button>
              <button
                onClick={() => ui.openSessionDialog()}
                className="inline-flex items-center gap-2 rounded-full ring-1 ring-hairline px-4 py-2.5 text-sm hover:bg-surface-sunken"
              >
                <Plus className="size-4" /> Log
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-3 gap-4 mb-10">
          <Stat label="Total time" value={`${Math.floor(total / 60)}h ${total % 60}m`} />
          <Stat label="Sessions" value={store.progressLogs.length} />
          <Stat label="Avg length" value={`${avg}m`} />
        </div>

        {Object.entries(grouped).map(([day, items]) => (
          <section key={day} className="mb-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-3">{day}</h2>
            <ul className="rounded-2xl bg-surface ring-1 ring-hairline divide-y divide-hairline overflow-hidden">
              {items.map((p) => (
                <li key={p._id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {p.goalTitle ?? "Standalone"} · {p.category}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-ink">{p.durationMinutes}m</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {store.progressLogs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-hairline p-12 text-center">
            <p className="font-serif text-2xl">No sessions logged yet</p>
            <p className="text-sm text-ink-muted mt-2">Start a focus session to see your log grow.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-hairline px-5 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
    </div>
  );
}
