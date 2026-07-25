import { createFileRoute } from "@tanstack/react-router";

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
import { useState } from "react";
import { AppShell, PageHeader, SectionLabel } from "@/components/app-shell";
import { useAppStore } from "@/lib/app-store";
import { notifySuccess } from "@/lib/notifications";
import { Pencil } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — PrepHub" },
      { name: "description", content: "Your learning identity in PrepHub." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const store = useAppStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(store.user.name);
  const [email, setEmail] = useState(store.user.email);
  const [focusArea, setFocusArea] = useState(store.user.focusArea);
  const [bio, setBio] = useState(store.user.bio);

  const save = () => {
    store.updateProfile({ name, email, focusArea, bio });
    notifySuccess("Profile updated", "Your profile details have been saved.");
    setEditing(false);
  };

  const streakDays = getStreakDays(store.progressLogs);
  const stats = [
    {
      label: "Study hours",
      value: Math.round(store.progressLogs.reduce((a, p) => a + p.durationMinutes, 0) / 60) + "h",
    },
    { label: "Streak", value: streakDays > 0 ? `${streakDays}d` : "0d" },
    { label: "Goals", value: store.goals.filter((g) => g.status === "active").length },
    { label: "Resources", value: store.resources.length },
  ];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-12 ph-fade-in">
        <PageHeader
          title="Profile"
          eyebrow="Your desk"
          actions={
            editing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-full ring-1 ring-hairline px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="rounded-full bg-forest text-page px-4 py-2 text-sm font-medium"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-full ring-1 ring-hairline px-4 py-2 text-sm hover:bg-surface-sunken"
              >
                <Pencil className="size-4" /> Edit
              </button>
            )
          }
        />

        <div className="flex items-center gap-6 mb-12">
          <div className="size-20 rounded-full bg-forest text-page grid place-items-center font-serif text-3xl">
            {store.user.name.slice(0, 1)}
          </div>
          <div>
            <h2 className="font-serif text-3xl">{store.user.name}</h2>
            <p className="text-ink-muted mt-1">{store.user.email}</p>
          </div>
        </div>

        <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[11px] uppercase tracking-[0.15em] text-ink-faint">{s.label}</p>
              <p className="mt-2 font-serif text-3xl">{s.value}</p>
            </div>
          ))}
        </section>

        <section>
          <SectionLabel>Account</SectionLabel>
          <div className="mt-5 rounded-xl bg-surface ring-1 ring-hairline divide-y divide-hairline">
            {editing ? (
              <>
                <Row label="Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Row>
                <Row label="Email">
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </Row>
                <Row label="Focus area">
                  <Input value={focusArea} onChange={(e) => setFocusArea(e.target.value)} />
                </Row>
                <Row label="Bio">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full text-sm bg-transparent focus:outline-none resize-none text-right"
                  />
                </Row>
              </>
            ) : (
              <>
                <Row label="Name">
                  <span className="text-sm">{store.user.name}</span>
                </Row>
                <Row label="Email">
                  <span className="text-sm">{store.user.email}</span>
                </Row>
                <Row label="Focus area">
                  <span className="text-sm">{store.user.focusArea}</span>
                </Row>
                <Row label="Bio">
                  <span className="text-sm text-right max-w-xs">{store.user.bio}</span>
                </Row>
                <Row label="Joined">
                  <span className="text-sm">{store.user.joined}</span>
                </Row>
              </>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-4">
      <span className="text-xs text-ink-faint uppercase tracking-wider shrink-0 pt-1">{label}</span>
      <div className="flex-1 text-right">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className="w-full text-sm bg-transparent focus:outline-none text-right" />
  );
}
