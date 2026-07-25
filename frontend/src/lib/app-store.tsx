import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import {
  type Goal,
  type Task,
  type Resource,
  type ActivityLog,
  type ProgressLog,
  type Concept,
  type TaskStatus,
  type GoalStatus,
  type ResourceType,
  type TaskPriority,
} from "./mock-data";
import {
  createGoalApi,
  createResourceApi,
  createStudySessionApi,
  deleteGoalApi,
  deleteResourceApi,
  getGoals,
  getResources,
  getStudySessionsApi,
  loginUser,
  updateGoalApi,
  updateResourceApi,
} from "./api";

export type Notification = {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type UserProfile = {
  name: string;
  email: string;
  focusArea: string;
  bio: string;
  joined: string;
};

export type Settings = {
  dailyGoalMinutes: number;
  sessionLength: number;
  reminders: boolean;
  weeklyEmail: boolean;
  soundCues: boolean;
  theme: "light" | "dark" | "system";
};

export type Session = {
  id: string;
  goalId?: string;
  goalTitle?: string;
  topic: string;
  notes: string;
  startedAt: number;
  endedAt?: number;
  paused: boolean;
  pausedAt?: number;
  accumulatedMs: number;
};

type Ctx = {
  isAuthed: boolean;
  user: UserProfile;
  settings: Settings;
  goals: Goal[];
  tasks: Task[];
  resources: Resource[];
  activities: ActivityLog[];
  progressLogs: ProgressLog[];
  concepts: Concept[];
  notifications: Notification[];
  activeSession: Session | null;
  // auth
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => void;
  // goals
  loadGoals: () => Promise<void>;
  loadResources: () => Promise<void>;
  createGoal: (data: Omit<Goal, "_id" | "createdAt" | "progress" | "modules">) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // tasks
  createTask: (data: Omit<Task, "_id">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  // resources
  createResource: (data: Omit<Resource, "_id" | "createdAt">) => Promise<Resource>;
  updateResource: (id: string, patch: Partial<Resource>) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  // sessions
  startSession: (input: { topic: string; goalId?: string; goalTitle?: string }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: (notes: string) => Promise<ProgressLog | null>;
  cancelSession: () => void;
  // notifications
  markNotificationsRead: () => void;
  // profile / settings
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  changePassword: (oldP: string, newP: string) => boolean;
  activity: (message: string, actionType?: string) => void;
};

const AppStoreContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultUser: UserProfile = {
  name: "",
  email: "",
  focusArea: "",
  bio: "",
  joined: new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" }),
};

const defaultSettings: Settings = {
  dailyGoalMinutes: 60,
  sessionLength: 25,
  reminders: false,
  weeklyEmail: false,
  soundCues: false,
  theme: "light",
};

function getStoredAuthState() {
  if (typeof window === "undefined") return false;

  try {
    const authFlag = window.localStorage.getItem("ph_auth");
    const token = window.localStorage.getItem("ph_token");
    return authFlag === "1" || Boolean(token);
  } catch {
    return false;
  }
}

function getStoredTasks() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem("ph_tasks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(getStoredAuthState);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks());
  const [resources, setResources] = useState<Resource[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [concepts] = useState<Concept[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const loadProgressLogs = async () => {
    try {
      const response = await getStudySessionsApi();
      const mappedLogs: ProgressLog[] = response.sessions.map((session) => ({
        _id: session._id,
        title: "Study session",
        category: "Focus",
        durationMinutes: session.duration,
        status: "completed",
        date: session.date || session.endedAt || new Date().toISOString(),
        goalTitle: undefined,
      }));
      setProgressLogs(mappedLogs);
    } catch (error) {
      console.error("Failed to load study sessions", error);
    }
  };

  // hydrate auth flag from localStorage (client only)
  useEffect(() => {
    setIsAuthed(getStoredAuthState());
    void loadProgressLogs();
  }, []);

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("ph_tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const activity = (message: string, actionType = "general") => {
    setActivities((prev) => [
      { _id: uid(), actionType, message, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  const pushNotification = (title: string, body: string) => {
    setNotifications((prev) => [
      { _id: uid(), title, body, createdAt: new Date().toISOString(), read: false },
      ...prev,
    ]);
  };

  const value: Ctx = useMemo(
    () => ({
      isAuthed,
      user,
      settings,
      goals,
      tasks,
      resources,
      activities,
      progressLogs,
      concepts,
      notifications,
      activeSession,
      signIn: async (email, password) => {
        if (!password) {
          throw new Error("Password is required");
        }

        const response = await loginUser(email, password);

        setIsAuthed(true);
        setUser((u) => ({
          ...u,
          email: response.user.email || u.email,
          name: response.user.username || u.name,
        }));

        try {
          localStorage.setItem("ph_auth", "1");
          localStorage.setItem("ph_token", response.accessToken);
        } catch {}
      },
      signOut: () => {
        setIsAuthed(false);
        try {
          localStorage.setItem("ph_auth", "0");
          localStorage.removeItem("ph_token");
        } catch {}
      },
      loadGoals: async () => {
        try {
          const response = await getGoals();
          const mappedGoals: Goal[] = response.goals.map((goal) => {
            const modules = Array.isArray(goal.modules) ? goal.modules : [];
            const progress = modules.length
              ? Math.round(
                  modules.reduce((sum, module) => {
                    if (!module.total) return sum;
                    return sum + Math.round((module.touched / module.total) * 100);
                  }, 0) / modules.length,
                )
              : 0;

            return {
              _id: goal._id,
              title: goal.title,
              description: goal.description || "",
              category: "Learning",
              status:
                goal.status === "completed"
                  ? "completed"
                  : goal.status === "paused"
                    ? "paused"
                    : "active",
              deadline: goal.targetDate || goal.createdAt || new Date().toISOString(),
              createdAt: goal.createdAt || new Date().toISOString(),
              progress,
              modules: modules.map((module) => ({
                _id: module._id,
                title: module.title,
                progress: module.total ? Math.round((module.touched / module.total) * 100) : 0,
                topics: [],
              })),
            };
          });

          setGoals(mappedGoals);
        } catch (error) {
          console.error("Failed to load goals", error);
        }
      },
      loadResources: async () => {
        try {
          const response = await getResources();
          const mappedResources: Resource[] = response.resources.map((resource) => ({
            _id: resource._id,
            title: resource.title,
            description: resource.description,
            type: (resource.type as ResourceType) || "link",
            url: resource.url,
            category: resource.conceptPath || undefined,
            notes: resource.breadcrumb,
            tags: resource.tags || [],
            favorite: Boolean(resource.favourite),
            goalId: resource.goalId,
            goalTitle: resource.conceptPath,
            createdAt: resource.createdAt || new Date().toISOString(),
          }));

          setResources(mappedResources);
        } catch (error) {
          console.error("Failed to load resources", error);
        }
      },
      createGoal: async (data) => {
        const response = await createGoalApi({
          title: data.title,
          description: data.description,
          targetDate: data.deadline,
          status: data.status,
        });

        const g: Goal = {
          ...data,
          _id: response.goal._id,
          createdAt: response.goal.createdAt,
          progress: 0,
          modules: [],
          category: data.category || "Learning",
          status:
            response.goal.status === "completed"
              ? "completed"
              : response.goal.status === "paused"
                ? "paused"
                : "active",
          deadline: response.goal.targetDate || response.goal.createdAt,
          title: response.goal.title,
          description: response.goal.description || data.description || "",
        };

        setGoals((prev) => [g, ...prev]);
        activity(`Created goal "${g.title}"`, "goal_updated");
        pushNotification("Goal created", g.title);
        return g;
      },
      updateGoal: async (id, patch) => {
        const response = await updateGoalApi(id, {
          title: patch.title,
          description: patch.description,
          targetDate: patch.deadline,
          status: patch.status,
        });

        setGoals((prev) =>
          prev.map((g) =>
            g._id === id
              ? {
                  ...g,
                  ...patch,
                  title: response.goal.title || patch.title || g.title,
                  description: response.goal.description || patch.description || g.description,
                  status:
                    response.goal.status === "completed"
                      ? "completed"
                      : response.goal.status === "paused"
                        ? "paused"
                        : "active",
                  deadline: response.goal.targetDate || patch.deadline || g.deadline,
                }
              : g,
          ),
        );
        activity(`Updated goal`, "goal_updated");
      },
      deleteGoal: async (id) => {
        const target = goals.find((g) => g._id === id);
        try {
          await deleteGoalApi(id);
        } catch (error) {
          console.error("Failed to delete goal", error);
          throw error;
        }

        setGoals((prev) => prev.filter((g) => g._id !== id));
        setTasks((prev) => prev.filter((t) => t.goalId !== id));
        setResources((prev) => prev.filter((r) => r.goalId !== id));
        if (target) activity(`Deleted goal "${target.title}"`, "goal_updated");
      },
      createTask: (data) => {
        const t: Task = { _id: uid(), ...data };
        setTasks((prev) => [t, ...prev]);
        activity(`Added task "${t.title}"`, "task_added");
        return t;
      },
      updateTask: (id, patch) => {
        setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, ...patch } : t)));
      },
      toggleTask: (id) => {
        setTasks((prev) =>
          prev.map((t) =>
            t._id === id
              ? {
                  ...t,
                  status: t.status === "completed" ? "todo" : "completed",
                  completedAt: t.status === "completed" ? undefined : new Date().toISOString(),
                }
              : t,
          ),
        );
        const t = tasks.find((x) => x._id === id);
        if (t && t.status !== "completed") activity(`Completed "${t.title}"`, "task_completed");
      },
      deleteTask: (id) => {
        setTasks((prev) => prev.filter((t) => t._id !== id));
      },
      createResource: async (data) => {
        const response = await createResourceApi({
          title: data.title,
          type: data.type,
          url: data.url,
          notes: data.notes,
          tags: data.tags,
          favorite: data.favorite,
          goalId: data.goalId,
        });

        const r: Resource = {
          _id: response.resource._id,
          createdAt: response.resource.createdAt,
          ...data,
          title: response.resource.title,
          description: response.resource.description,
          type: (response.resource.type as ResourceType) || data.type,
          url: response.resource.url,
          tags: response.resource.tags || data.tags,
          favorite: Boolean(response.resource.favourite ?? data.favorite),
        };

        setResources((prev) => [r, ...prev]);
        activity(`Saved resource "${r.title}"`, "resource_added");
        return r;
      },
      updateResource: async (id, patch) => {
        const response = await updateResourceApi(id, {
          title: patch.title,
          type: patch.type,
          url: patch.url,
          notes: patch.notes,
          tags: patch.tags,
          favorite: patch.favorite,
          goalId: patch.goalId,
        });

        setResources((prev) =>
          prev.map((r) =>
            r._id === id
              ? {
                  ...r,
                  ...patch,
                  title: response.resource.title || patch.title || r.title,
                  description: response.resource.description,
                  type: (response.resource.type as ResourceType) || patch.type || r.type,
                  url: response.resource.url || patch.url || r.url,
                  tags: response.resource.tags || patch.tags || r.tags,
                  favorite: Boolean(response.resource.favourite ?? patch.favorite ?? r.favorite),
                  goalId: response.resource.goalId || patch.goalId || r.goalId,
                }
              : r,
          ),
        );
      },
      toggleFavorite: async (id) => {
        const current = resources.find((r) => r._id === id);
        if (!current) return;
        await updateResourceApi(id, { favorite: !current.favorite });
        setResources((prev) =>
          prev.map((r) => (r._id === id ? { ...r, favorite: !r.favorite } : r)),
        );
      },
      deleteResource: async (id) => {
        try {
          await deleteResourceApi(id);
        } catch (error) {
          console.error("Failed to delete resource", error);
          throw error;
        }
        setResources((prev) => prev.filter((r) => r._id !== id));
      },
      startSession: ({ topic, goalId, goalTitle }) => {
        setActiveSession({
          id: uid(),
          topic,
          goalId,
          goalTitle,
          notes: "",
          startedAt: Date.now(),
          paused: false,
          accumulatedMs: 0,
        });
        activity(`Started session on ${topic}`, "progress_logged");
      },
      pauseSession: () => {
        setActiveSession((s) => {
          if (!s || s.paused) return s;
          return {
            ...s,
            paused: true,
            pausedAt: Date.now(),
            accumulatedMs: s.accumulatedMs + (Date.now() - s.startedAt),
          };
        });
      },
      resumeSession: () => {
        setActiveSession((s) =>
          s && s.paused ? { ...s, paused: false, startedAt: Date.now() } : s,
        );
      },
      finishSession: async (notes) => {
        const s = activeSession;
        if (!s) return null;
        const elapsedMs = s.accumulatedMs + (s.paused ? 0 : Date.now() - s.startedAt);
        const minutes = Math.max(1, Math.round(elapsedMs / 60000));
        const log: ProgressLog = {
          _id: uid(),
          title: s.topic,
          category: s.goalTitle ?? "Focus",
          durationMinutes: minutes,
          status: "completed",
          date: new Date().toISOString(),
          goalTitle: s.goalTitle,
        };

        try {
          await createStudySessionApi({
            conceptId: "000000000000000000000000",
            duration: minutes,
            startedAt: s.startedAt,
            endedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Failed to sync study session", error);
        }

        setProgressLogs((prev) => [log, ...prev]);
        activity(`Logged ${minutes}m on ${s.topic}`, "progress_logged");
        if (notes.trim()) activity(`Saved session notes`, "note_saved");
        setActiveSession(null);
        pushNotification("Session complete", `${minutes} min on ${s.topic}`);
        return log;
      },
      cancelSession: () => setActiveSession(null),
      markNotificationsRead: () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
      updateProfile: (patch) => {
        setUser((u) => ({ ...u, ...patch }));
        activity("Updated profile", "profile_updated");
      },
      updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),
      changePassword: () => true,
      activity,
    }),
    [
      isAuthed,
      user,
      settings,
      goals,
      tasks,
      resources,
      activities,
      progressLogs,
      concepts,
      notifications,
      activeSession,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}

export type { Goal, Task, Resource, TaskStatus, GoalStatus, ResourceType, TaskPriority };
