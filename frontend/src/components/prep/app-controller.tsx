import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, Square, Bell, Target, ListChecks, BookOpen } from "lucide-react";
import { useAppStore, type Goal, type Task, type Resource } from "@/lib/app-store";
import type { ResourceType, TaskPriority, GoalStatus } from "@/lib/mock-data";

type ConfirmOpts = {
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
};

type UiCtx = {
  openGoalDialog: (goal?: Goal) => void;
  openTaskDialog: (task?: Task, defaults?: Partial<Task>) => void;
  openResourceDialog: (resource?: Resource, defaults?: Partial<Resource>) => void;
  openSessionDialog: (defaults?: { topic?: string; goalId?: string; goalTitle?: string }) => void;
  openSearch: () => void;
  openNotifications: () => void;
  confirm: (opts: ConfirmOpts) => void;
};

const UiContext = createContext<UiCtx | null>(null);

export function useAppUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useAppUi must be used inside AppController");
  return ctx;
}

export function AppController({ children }: { children: ReactNode }) {
  const [goalDialog, setGoalDialog] = useState<{ open: boolean; goal?: Goal }>({ open: false });
  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    task?: Task;
    defaults?: Partial<Task>;
  }>({ open: false });
  const [resourceDialog, setResourceDialog] = useState<{
    open: boolean;
    resource?: Resource;
    defaults?: Partial<Resource>;
  }>({ open: false });
  const [sessionDialog, setSessionDialog] = useState<{
    open: boolean;
    defaults?: { topic?: string; goalId?: string; goalTitle?: string };
  }>({ open: false });
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { open: boolean }) | null>(null);

  // Apply theme to <html>
  const theme = useAppStore().settings.theme;
  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode: "light" | "dark") => {
      root.classList.toggle("dark", mode === "dark");
    };
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    apply(theme);
  }, [theme]);

  // ⌘K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ui: UiCtx = {
    openGoalDialog: (goal) => setGoalDialog({ open: true, goal }),
    openTaskDialog: (task, defaults) => setTaskDialog({ open: true, task, defaults }),
    openResourceDialog: (resource, defaults) =>
      setResourceDialog({ open: true, resource, defaults }),
    openSessionDialog: (defaults) => setSessionDialog({ open: true, defaults }),
    openSearch: () => setSearchOpen(true),
    openNotifications: () => setNotifOpen(true),
    confirm: (opts) => setConfirmState({ ...opts, open: true }),
  };

  return (
    <UiContext.Provider value={ui}>
      {children}
      <Toaster position="bottom-right" />
      <GoalDialog
        open={goalDialog.open}
        goal={goalDialog.goal}
        onOpenChange={(v) => setGoalDialog((s) => ({ ...s, open: v }))}
      />
      <TaskDialog
        open={taskDialog.open}
        task={taskDialog.task}
        defaults={taskDialog.defaults}
        onOpenChange={(v) => setTaskDialog((s) => ({ ...s, open: v }))}
      />
      <ResourceDialog
        open={resourceDialog.open}
        resource={resourceDialog.resource}
        defaults={resourceDialog.defaults}
        onOpenChange={(v) => setResourceDialog((s) => ({ ...s, open: v }))}
      />
      <SessionDialog
        open={sessionDialog.open}
        defaults={sessionDialog.defaults}
        onOpenChange={(v) => setSessionDialog((s) => ({ ...s, open: v }))}
      />
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <NotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />
      <AlertDialog
        open={!!confirmState?.open}
        onOpenChange={(v) => setConfirmState((s) => (s ? { ...s, open: v } : s))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            {confirmState?.description && (
              <AlertDialogDescription>{confirmState.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmState?.onConfirm();
                setConfirmState(null);
              }}
            >
              {confirmState?.confirmText ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UiContext.Provider>
  );
}

// ---------------- Goal Dialog ----------------
function GoalDialog({
  open,
  goal,
  onOpenChange,
}: {
  open: boolean;
  goal?: Goal;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useAppStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<GoalStatus>("active");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(goal?.title ?? "");
      setDescription(goal?.description ?? "");
      setCategory(goal?.category ?? "Placement");
      setStatus(goal?.status ?? "active");
      setDeadline(goal?.deadline?.slice(0, 10) ?? "");
    }
  }, [open, goal]);

  const submit = async () => {
    if (!title.trim())
      return notifyError("Title is required", "Please enter a clear title before saving.");
    const iso = deadline
      ? new Date(deadline).toISOString()
      : new Date(Date.now() + 30 * 86400e3).toISOString();

    try {
      if (goal) {
        await store.updateGoal(goal._id, { title, description, category, status, deadline: iso });
        notifySuccess("Goal updated", "Your changes have been saved.");
      } else {
        await store.createGoal({ title, description, category, status, deadline: iso });
        notifySuccess("Goal created", "Your new goal is ready to track.");
      }
      onOpenChange(false);
    } catch (error) {
      notifyError(
        "Could not save goal",
        error instanceof Error ? error.message : "Please try again in a moment.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {goal ? "Edit goal" : "New goal"}
          </DialogTitle>
          <DialogDescription>
            Set your intention. Break it into modules and topics later.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>
            <Field label="Deadline">
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </Field>
          </div>
          <Field label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{goal ? "Save changes" : "Create goal"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Task Dialog ----------------
function TaskDialog({
  open,
  task,
  defaults,
  onOpenChange,
}: {
  open: boolean;
  task?: Task;
  defaults?: Partial<Task>;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useAppStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimated, setEstimated] = useState<string>("");
  const [goalId, setGoalId] = useState<string>("none");

  useEffect(() => {
    if (open) {
      const base = task ?? defaults ?? {};
      setTitle(base.title ?? "");
      setDescription(base.description ?? "");
      setPriority(base.priority ?? "medium");
      setDueDate(base.dueDate?.slice(0, 10) ?? "");
      setEstimated(base.estimatedMinutes?.toString() ?? "");
      setGoalId(base.goalId ?? "none");
    }
  }, [open, task, defaults]);

  const submit = () => {
    if (!title.trim())
      return notifyError("Title is required", "Add a short task title before continuing.");
    const linked = store.goals.find((g) => g._id === goalId);
    const payload = {
      title,
      description: description || undefined,
      priority,
      status: task?.status ?? ("todo" as const),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      estimatedMinutes: estimated ? parseInt(estimated) : undefined,
      goalId: linked?._id,
      goalTitle: linked?.title,
    };
    if (task) {
      store.updateTask(task._id, payload);
      notifySuccess("Task updated", "Your task details are now saved.");
    } else {
      store.createTask(payload);
      notifySuccess("Task added", "The task has been added to your plan.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {task ? "Edit task" : "New task"}
          </DialogTitle>
          <DialogDescription>A small commitment for today or later this week.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estimated (min)">
              <Input
                type="number"
                value={estimated}
                onChange={(e) => setEstimated(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Due date">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Goal">
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Standalone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone</SelectItem>
                  {store.goals.map((g) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{task ? "Save" : "Add task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Resource Dialog ----------------
function ResourceDialog({
  open,
  resource,
  defaults,
  onOpenChange,
}: {
  open: boolean;
  resource?: Resource;
  defaults?: Partial<Resource>;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useAppStore();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("video");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [goalId, setGoalId] = useState<string>("none");

  useEffect(() => {
    if (open) {
      const b = resource ?? defaults ?? {};
      setTitle(b.title ?? "");
      setType(b.type ?? "video");
      setUrl(b.url ?? "");
      setTags((b.tags ?? []).join(", "));
      setNotes(b.notes ?? "");
      setGoalId(b.goalId ?? "none");
    }
  }, [open, resource, defaults]);

  const submit = async () => {
    if (!title.trim())
      return notifyError("Title is required", "Please enter a clear title before saving.");
    const linked = store.goals.find((g) => g._id === goalId);
    const payload = {
      title,
      type,
      url: url || undefined,
      notes: notes || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      favorite: resource?.favorite ?? false,
      goalId: linked?._id,
      goalTitle: linked?.title,
    };

    try {
      if (resource) {
        await store.updateResource(resource._id, payload);
        notifySuccess("Resource updated", "The resource has been updated.");
      } else {
        await store.createResource(payload);
        notifySuccess("Resource saved", "Your resource is now available in your library.");
      }
      onOpenChange(false);
    } catch (error) {
      notifyError(
        "Could not save resource",
        error instanceof Error ? error.message : "Please try again in a moment.",
      );
    }
  };

  const types: { value: ResourceType; label: string }[] = [
    { value: "video", label: "Video" },
    { value: "pdf", label: "PDF" },
    { value: "doc", label: "Documentation" },
    { value: "repo", label: "GitHub" },
    { value: "link", label: "Website" },
    { value: "note", label: "Notes" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {resource ? "Edit resource" : "Save a resource"}
          </DialogTitle>
          <DialogDescription>
            Anything worth returning to — a video, PDF, article, or your own notes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <Field label="Type">
            <div className="grid grid-cols-3 gap-2">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-2 rounded-md text-xs font-medium ring-1 transition-colors ${type === t.value ? "bg-ink text-page ring-ink" : "ring-hairline hover:bg-surface-sunken"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          {(type === "pdf" || type === "doc") && (
            <Field label={type === "pdf" ? "Upload PDF" : "Upload documentation (PDF)"}>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!title) setTitle(file.name.replace(/\.pdf$/i, ""));
                  setUrl(URL.createObjectURL(file));
                  notifySuccess("File attached", `${file.name} has been added to this resource.`);
                }}
              />
              {url && (
                <p className="text-xs text-ink-faint mt-1 truncate">
                  Attached: {url.startsWith("blob:") ? "local file" : url}
                </p>
              )}
            </Field>
          )}
          {type !== "note" && type !== "pdf" && type !== "doc" && (
            <Field label="URL">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            </Field>
          )}
          {(type === "note" || (!url && type !== "pdf" && type !== "doc")) && (
            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tags (comma separated)">
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <Field label="Goal">
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {store.goals.map((g) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{resource ? "Save" : "Save resource"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Session Dialog ----------------
function SessionDialog({
  open,
  defaults,
  onOpenChange,
}: {
  open: boolean;
  defaults?: { topic?: string; goalId?: string; goalTitle?: string };
  onOpenChange: (v: boolean) => void;
}) {
  const store = useAppStore();
  const [topic, setTopic] = useState("");
  const [goalId, setGoalId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [tick, setTick] = useState(0);
  const [summary, setSummary] = useState<{ minutes: number; topic: string } | null>(null);
  const intervalRef = useRef<number | null>(null);

  const active = store.activeSession;

  useEffect(() => {
    if (open && !active) {
      setTopic(defaults?.topic ?? "");
      setGoalId(defaults?.goalId ?? "none");
      setNotes("");
      setSummary(null);
    }
  }, [open, defaults, active]);

  useEffect(() => {
    if (active && !active.paused) {
      intervalRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      };
    }
  }, [active?.paused, active?.id]);

  const elapsedMs = active
    ? active.accumulatedMs + (active.paused ? 0 : Date.now() - active.startedAt)
    : 0;
  void tick;
  const mm = Math.floor(elapsedMs / 60000);
  const ss = Math.floor((elapsedMs % 60000) / 1000);

  const start = () => {
    if (!topic.trim())
      return notifyError(
        "Topic is required",
        "Please enter what you’re focusing on before starting.",
      );
    const g = store.goals.find((x) => x._id === goalId);
    store.startSession({ topic, goalId: g?._id, goalTitle: g?.title });
    notifySuccess("Session started", "Your focused study timer is running.");
  };
  const finish = async () => {
    const log = await store.finishSession(notes);
    if (log) setSummary({ minutes: log.durationMinutes, topic: log.title });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !active) setSummary(null);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {summary ? "Session complete" : active ? "Study session" : "Start a session"}
          </DialogTitle>
          <DialogDescription>
            {summary
              ? "Nice work. Your log has been saved."
              : "Focus on one thing for a short block."}
          </DialogDescription>
        </DialogHeader>

        {summary ? (
          <div className="py-4">
            <p className="text-sm text-ink-muted">You studied</p>
            <p className="font-serif text-5xl mt-1">{summary.minutes}m</p>
            <p className="text-sm text-ink-muted mt-4">on {summary.topic}</p>
            <DialogFooter className="mt-6">
              <Button
                onClick={() => {
                  setSummary(null);
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : active ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="text-center py-6 rounded-xl bg-surface-sunken/60 ring-1 ring-hairline">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-faint">
                {active.topic}
              </p>
              <p className="font-serif text-6xl mt-3 tabular-nums">
                {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              </p>
              {active.goalTitle && (
                <p className="text-xs text-ink-muted mt-2">{active.goalTitle}</p>
              )}
            </div>
            <Field label="Session notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What did you cover?"
              />
            </Field>
            <div className="flex gap-2">
              {active.paused ? (
                <Button className="flex-1" onClick={store.resumeSession}>
                  <Play className="size-4" /> Resume
                </Button>
              ) : (
                <Button className="flex-1" variant="secondary" onClick={store.pauseSession}>
                  <Pause className="size-4" /> Pause
                </Button>
              )}
              <Button className="flex-1" onClick={finish}>
                <Square className="size-4" /> Finish
              </Button>
            </div>
            <button
              type="button"
              onClick={() => {
                store.cancelSession();
                onOpenChange(false);
              }}
              className="text-xs text-ink-faint hover:text-ink text-center"
            >
              Cancel session
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <Field label="Topic">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What are you focusing on?"
              />
            </Field>
            <Field label="Goal (optional)">
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Standalone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone</SelectItem>
                  {store.goals.map((g) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={start}>
                <Play className="size-4" /> Start session
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Search palette ----------------
function SearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useAppStore();
  const navigate = useNavigate();
  const go = (fn: () => void) => {
    onOpenChange(false);
    setTimeout(fn, 10);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search goals, tasks, resources…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Jump to">
          <CommandItem onSelect={() => go(() => navigate("/"))}>Home</CommandItem>
          <CommandItem onSelect={() => go(() => navigate("/goals"))}>Goals</CommandItem>
          <CommandItem onSelect={() => go(() => navigate("/tasks"))}>Tasks</CommandItem>
          <CommandItem onSelect={() => go(() => navigate("/resources"))}>
            Resources
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate("/sessions"))}>
            Sessions
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate("/journey"))}>Journey</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Goals">
          {store.goals.map((g) => (
            <CommandItem
              key={g._id}
              onSelect={() =>
                go(() => navigate(`/goals/${g._id}`))
              }
            >
              <Target className="size-4" /> {g.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tasks">
          {store.tasks.slice(0, 15).map((t) => (
            <CommandItem key={t._id} onSelect={() => go(() => navigate("/tasks"))}>
              <ListChecks className="size-4" /> {t.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Resources">
          {store.resources.slice(0, 15).map((r) => (
            <CommandItem key={r._id} onSelect={() => go(() => navigate("/resources"))}>
              <BookOpen className="size-4" /> {r.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// ---------------- Notifications sheet ----------------
function NotificationsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useAppStore();
  useEffect(() => {
    if (open) store.markNotificationsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px]">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl flex items-center gap-2">
            <Bell className="size-5" /> Notifications
          </SheetTitle>
          <SheetDescription>Quiet nudges from your study desk.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col divide-y divide-hairline">
          {store.notifications.length === 0 && (
            <p className="text-sm text-ink-faint py-8 text-center">Nothing here yet.</p>
          )}
          {store.notifications.map((n) => (
            <div key={n._id} className="py-4">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-sm text-ink-muted mt-1">{n.body}</p>
              <p className="text-[11px] text-ink-faint mt-1">
                {new Date(n.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-ink-muted">{label}</Label>
      {children}
    </div>
  );
}
