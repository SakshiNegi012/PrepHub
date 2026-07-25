import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, SectionLabel } from "@/components/app-shell";
import { useAppStore } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";
import { notifyError, notifySuccess } from "@/lib/notifications";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PrepHub" },
      { name: "description", content: "Tune PrepHub to your study habits." },
    ],
  }),
  component: SettingsPage,
});

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-6">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-ink-faint mt-0.5 max-w-md">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={
        "relative w-10 h-6 rounded-full transition-colors " + (on ? "bg-ink" : "bg-hairline")
      }
    >
      <span
        className={
          "absolute top-0.5 size-5 rounded-full bg-page transition-all " +
          (on ? "left-[18px]" : "left-0.5")
        }
      />
    </button>
  );
}

function SettingsPage() {
  const store = useAppStore();
  const ui = useAppUi();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ open: false, old: "", next: "" });

  const setS = (patch: Partial<typeof store.settings>) => store.updateSettings(patch);

  const exportData = () => {
    const data = {
      user: store.user,
      goals: store.goals,
      tasks: store.tasks,
      resources: store.resources,
      progressLogs: store.progressLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prephub-export.json";
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess("Data exported", "Your export is ready to download.");
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <PageHeader
          eyebrow="Preferences"
          title="Settings"
          description="Small choices that shape how PrepHub feels each morning."
        />

        <section className="mb-10">
          <SectionLabel>General</SectionLabel>
          <div className="mt-5 rounded-xl bg-surface ring-1 ring-hairline divide-y divide-hairline">
            <Row label="Daily focus reminder" description="A gentle nudge at your preferred time.">
              <Toggle on={store.settings.reminders} onChange={(v) => setS({ reminders: v })} />
            </Row>
            <Row label="Weekly reflection email" description="Sunday summary of your progress.">
              <Toggle on={store.settings.weeklyEmail} onChange={(v) => setS({ weeklyEmail: v })} />
            </Row>
            <Row label="Sound cues" description="Soft chimes when a session ends.">
              <Toggle on={store.settings.soundCues} onChange={(v) => setS({ soundCues: v })} />
            </Row>
            <Row label="Theme">
              <select
                value={store.settings.theme}
                onChange={(e) => setS({ theme: e.target.value as any })}
                className="bg-transparent text-sm border border-hairline rounded px-2 py-1"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </Row>
          </div>
        </section>

        <section className="mb-10">
          <SectionLabel>Study rhythm</SectionLabel>
          <div className="mt-5 rounded-xl bg-surface ring-1 ring-hairline divide-y divide-hairline">
            <Row label="Daily target" description="How much focused time you aim for each day.">
              <select
                value={store.settings.dailyGoalMinutes}
                onChange={(e) => setS({ dailyGoalMinutes: parseInt(e.target.value) })}
                className="bg-transparent text-sm border border-hairline rounded px-2 py-1"
              >
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </Row>
            <Row label="Session length">
              <select
                value={store.settings.sessionLength}
                onChange={(e) => setS({ sessionLength: parseInt(e.target.value) })}
                className="bg-transparent text-sm border border-hairline rounded px-2 py-1"
              >
                <option value={25}>25 min · Pomodoro</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </Row>
          </div>
        </section>

        <section>
          <SectionLabel>Account</SectionLabel>
          <div className="mt-5 rounded-xl bg-surface ring-1 ring-hairline divide-y divide-hairline">
            <Row label="Edit profile" description="Update your name, email, and focus area.">
              <Link to="/profile" className="text-sm text-ink-muted hover:text-ink">
                Open profile
              </Link>
            </Row>
            <Row label="Change password">
              {pw.open ? (
                <div className="flex flex-col gap-2 w-64">
                  <input
                    type="password"
                    placeholder="Current"
                    value={pw.old}
                    onChange={(e) => setPw({ ...pw, old: e.target.value })}
                    className="text-sm px-2 py-1 rounded bg-surface-sunken/60 ring-1 ring-hairline"
                  />
                  <input
                    type="password"
                    placeholder="New"
                    value={pw.next}
                    onChange={(e) => setPw({ ...pw, next: e.target.value })}
                    className="text-sm px-2 py-1 rounded bg-surface-sunken/60 ring-1 ring-hairline"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setPw({ open: false, old: "", next: "" })}
                      className="text-xs text-ink-muted"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!pw.old || !pw.next)
                          return notifyError(
                            "Please fill in all required fields",
                            "Enter both your current and new password before updating.",
                          );
                        store.changePassword(pw.old, pw.next);
                        notifySuccess(
                          "Password updated",
                          "Your password has been changed successfully.",
                        );
                        setPw({ open: false, old: "", next: "" });
                      }}
                      className="text-xs bg-ink text-page rounded px-2 py-1"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setPw({ ...pw, open: true })}
                  className="text-sm text-ink-muted hover:text-ink"
                >
                  Update
                </button>
              )}
            </Row>
            <Row label="Export your data" description="Download everything as JSON.">
              <button onClick={exportData} className="text-sm text-ink-muted hover:text-ink">
                Export
              </button>
            </Row>
            <Row label="Delete account" description="This cannot be undone.">
              <button
                onClick={() =>
                  ui.confirm({
                    title: "Delete account?",
                    description: "All your goals, tasks, and resources will be removed.",
                    confirmText: "Delete",
                    onConfirm: () => {
                      store.signOut();
                      notifySuccess(
                        "Account deleted",
                        "Your account has been removed from PrepHub.",
                      );
                      navigate({ to: "/auth" });
                    },
                  })
                }
                className="text-sm text-destructive hover:opacity-80"
              >
                Delete
              </button>
            </Row>
            <Row label="Sign out">
              <button
                onClick={() => {
                  store.signOut();
                  navigate({ to: "/auth" });
                }}
                className="text-sm text-destructive hover:opacity-80"
              >
                Sign out
              </button>
            </Row>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
