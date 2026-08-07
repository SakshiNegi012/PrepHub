import { Link, useLocation, useNavigate } from "react-router-dom";

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
import type { ReactNode } from "react";
import {
  Home,
  Target,
  BookOpen,
  Clock,
  TrendingUp,
  Settings,
  BookMarked,
  Flame,
  Search,
  Bell,
  Play,
  ListChecks,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/app-store";
import { useAppUi } from "@/components/prep/app-controller";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryNav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/sessions", label: "Sessions", icon: Clock },
  { to: "/journey", label: "Journey", icon: TrendingUp },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const store = useAppStore();
  const ui = useAppUi();
  const navigate = useNavigate();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayMinutes = store.progressLogs
    .filter((p) => p.date.slice(0, 10) === todayISO)
    .reduce((a, p) => a + p.durationMinutes, 0);
  const dailyGoal = store.settings.dailyGoalMinutes;
  const pct = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));
  const unread = store.notifications.filter((n) => !n.read).length;
  const streakDays = getStreakDays(store.progressLogs);

  const handleSignOut = () => {
    store.signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-hairline px-4 py-6 gap-6 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2.5 px-2 pt-1">
          <span className="grid size-8 place-items-center rounded-md bg-forest text-page">
            <BookMarked className="size-4" strokeWidth={2} />
          </span>
          <span className="font-serif text-2xl tracking-tight leading-none">PrepHub</span>
        </Link>

        {/* User card + menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl bg-surface ring-1 ring-hairline px-3 py-2.5 hover:ring-forest/20 transition-shadow text-left">
              <span className="grid size-9 place-items-center rounded-full bg-forest text-page text-xs font-semibold">
                {store.user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="flex flex-col leading-tight min-w-0 flex-1">
                <span className="text-sm font-semibold truncate">{store.user.name}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint mt-0.5">
                  <Flame className="size-3 text-flame" strokeWidth={2.2} />
                  {streakDays > 0 ? `${streakDays}-day streak` : "No streak yet"}
                </span>
              </span>
              <ChevronDown className="size-3.5 text-ink-faint" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>{store.user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <nav className="flex flex-col gap-0.5">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-forest text-page font-medium"
                    : "text-ink-muted hover:text-ink hover:bg-surface-sunken",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="rounded-xl bg-surface ring-1 ring-hairline px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Today
            </p>
            <p className="mt-1 font-serif text-2xl leading-none">
              <span className="text-ink-faint">{Math.floor(todayMinutes / 60)}h</span>{" "}
              <span>{todayMinutes % 60}m</span>
            </p>
            <div className="mt-2.5 h-1 rounded-full bg-hairline overflow-hidden">
              <div
                className="h-full rounded-full bg-forest transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">
              Goal: {Math.round(dailyGoal / 60)}h per day
            </p>
          </div>

          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive("/settings")
                ? "bg-surface-sunken text-ink font-medium"
                : "text-ink-muted hover:text-ink hover:bg-surface-sunken",
            )}
          >
            <Settings className="size-4" strokeWidth={2} />
            Settings
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Top action bar */}
        <div className="sticky top-0 z-30 backdrop-blur bg-page/85 border-b border-hairline">
          <div className="flex items-center gap-2 px-6 md:px-12 py-3">
            <button
              onClick={ui.openSearch}
              className="flex items-center gap-2 flex-1 max-w-md text-sm rounded-md bg-surface ring-1 ring-hairline px-3 py-1.5 text-ink-faint hover:ring-ink/20 transition-shadow"
            >
              <Search className="size-4" />
              <span>Search everything…</span>
              <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-hairline text-ink-muted">
                ⌘K
              </kbd>
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => ui.openSessionDialog()}
                className="hidden sm:inline-flex items-center gap-2 rounded-md bg-forest text-page px-3 py-1.5 text-sm font-medium hover:bg-forest-soft transition-colors"
              >
                <Play className="size-3.5" />
                {store.activeSession ? "Session running" : "Start session"}
              </button>
              <button
                onClick={ui.openNotifications}
                className="relative p-2 rounded-md hover:bg-surface-sunken text-ink-muted"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-clay" />
                )}
              </button>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-6 mb-10">
      <div className="flex flex-col gap-2 min-w-0">
        {eyebrow && (
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-faint">
            {eyebrow}
          </span>
        )}
        <h1 className="font-serif text-4xl leading-[1.05] text-balance">{title}</h1>
        {description && <p className="text-ink-muted max-w-[56ch] text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="font-serif text-xl leading-none">{children}</h2>;
}
