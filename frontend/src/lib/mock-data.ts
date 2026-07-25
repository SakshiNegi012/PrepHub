// Mock data mirroring backend Mongoose schemas. Swap for real API calls later.

export type GoalStatus = "active" | "paused" | "completed";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type ResourceType = "video" | "pdf" | "doc" | "link" | "repo" | "note";

export interface Goal {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: GoalStatus;
  deadline: string; // ISO
  createdAt: string;
  progress: number; // 0-100 (derived)
  modules: Module[];
}

export interface Module {
  _id: string;
  title: string;
  progress: number;
  topics: Topic[];
}

export interface Topic {
  _id: string;
  title: string;
  progress: number;
  concepts: Concept[];
}

export interface Concept {
  _id: string;
  title: string;
  summary: string;
  progress: number;
  timeSpentMinutes: number;
  resources: Resource[];
  tasks: Task[];
  notes: string;
  lastOpenedAt: string;
  goalId: string;
  goalTitle: string;
  moduleTitle: string;
  topicTitle: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  estimatedMinutes?: number;
  completedAt?: string;
  goalId?: string;
  goalTitle?: string;
}

export interface Resource {
  _id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url?: string;
  category?: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
  goalId?: string;
  goalTitle?: string;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  actionType: string;
  message: string;
  referenceType?: string;
  createdAt: string;
}

export interface ProgressLog {
  _id: string;
  title: string;
  category: string;
  durationMinutes: number;
  status: TaskStatus;
  date: string;
  goalTitle?: string;
}

// -------- Data --------
const now = new Date();
const iso = (daysAgo = 0, hoursAgo = 0) =>
  new Date(now.getTime() - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();

export const concepts: Concept[] = [
  {
    _id: "c1",
    title: "Percentage",
    summary:
      "Base-100 arithmetic, successive change formula (a + b + ab/100), and quick fraction equivalents used throughout aptitude problems.",
    progress: 75,
    timeSpentMinutes: 142,
    lastOpenedAt: iso(0, 2),
    goalId: "g1",
    goalTitle: "Crack TCS",
    moduleTitle: "Aptitude",
    topicTitle: "Numerical Ability",
    notes:
      "Successive % change → a + b + ab/100.\nCommon fractions: 12.5% = 1/8, 16.6% = 1/6, 20% = 1/5.\nAlways convert to fractions before computing when possible.",
    resources: [
      {
        _id: "r1",
        title: "Percentages — Full Concept Walkthrough",
        type: "video",
        url: "https://youtube.com",
        tags: ["aptitude", "video"],
        favorite: true,
        createdAt: iso(3),
      },
      {
        _id: "r2",
        title: "TCS Sample Questions — Quantitative.pdf",
        type: "pdf",
        tags: ["tcs", "practice"],
        favorite: false,
        createdAt: iso(1),
      },
      {
        _id: "r3",
        title: "Personal Notes — Fraction Equivalents",
        type: "note",
        tags: ["revision"],
        favorite: true,
        createdAt: iso(0, 4),
      },
    ],
    tasks: [
      {
        _id: "t1",
        title: "Solve practice set 4: Profit & Loss",
        priority: "high",
        status: "todo",
        estimatedMinutes: 25,
        goalId: "g1",
        goalTitle: "Crack TCS",
      },
      {
        _id: "t2",
        title: "Review successive change problems",
        priority: "medium",
        status: "in_progress",
        estimatedMinutes: 15,
      },
      {
        _id: "t3",
        title: "Watch: Percentage shortcuts",
        priority: "low",
        status: "completed",
        completedAt: iso(1),
      },
    ],
  },
  {
    _id: "c2",
    title: "Profit & Loss",
    summary: "Cost price, selling price, discounts, and marked-up chains.",
    progress: 40,
    timeSpentMinutes: 60,
    lastOpenedAt: iso(1),
    goalId: "g1",
    goalTitle: "Crack TCS",
    moduleTitle: "Aptitude",
    topicTitle: "Numerical Ability",
    notes: "",
    resources: [],
    tasks: [],
  },
  {
    _id: "c3",
    title: "Recursion",
    summary: "Base cases, recursive tree, memoization pathway.",
    progress: 55,
    timeSpentMinutes: 220,
    lastOpenedAt: iso(0, 20),
    goalId: "g1",
    goalTitle: "Crack TCS",
    moduleTitle: "DSA",
    topicTitle: "Foundations",
    notes: "",
    resources: [],
    tasks: [],
  },
];

export const goals: Goal[] = [
  {
    _id: "g1",
    title: "Crack TCS",
    description: "Full preparation across aptitude, DSA, CS fundamentals, projects and HR round.",
    category: "Placement",
    status: "active",
    deadline: iso(-42),
    createdAt: iso(60),
    progress: 62,
    modules: [
      {
        _id: "m1",
        title: "Aptitude",
        progress: 70,
        topics: [
          {
            _id: "tp1",
            title: "Numerical Ability",
            progress: 65,
            concepts: [
              concepts[0],
              concepts[1],
              {
                _id: "c4",
                title: "Time & Work",
                summary: "",
                progress: 30,
                timeSpentMinutes: 40,
                lastOpenedAt: iso(3),
                goalId: "g1",
                goalTitle: "Crack TCS",
                moduleTitle: "Aptitude",
                topicTitle: "Numerical Ability",
                notes: "",
                resources: [],
                tasks: [],
              },
              {
                _id: "c5",
                title: "Averages",
                summary: "",
                progress: 20,
                timeSpentMinutes: 25,
                lastOpenedAt: iso(6),
                goalId: "g1",
                goalTitle: "Crack TCS",
                moduleTitle: "Aptitude",
                topicTitle: "Numerical Ability",
                notes: "",
                resources: [],
                tasks: [],
              },
            ],
          },
          {
            _id: "tp2",
            title: "Logical Reasoning",
            progress: 45,
            concepts: [],
          },
          {
            _id: "tp3",
            title: "Verbal Ability",
            progress: 30,
            concepts: [],
          },
        ],
      },
      {
        _id: "m2",
        title: "DSA",
        progress: 50,
        topics: [
          {
            _id: "tp4",
            title: "Foundations",
            progress: 60,
            concepts: [concepts[2]],
          },
          { _id: "tp5", title: "Trees & Graphs", progress: 25, concepts: [] },
        ],
      },
      { _id: "m3", title: "Computer Science", progress: 40, topics: [] },
      { _id: "m4", title: "Projects", progress: 30, topics: [] },
      { _id: "m5", title: "HR Interview", progress: 15, topics: [] },
    ],
  },
  {
    _id: "g2",
    title: "Master System Design",
    description: "Deep dive into distributed systems, caching, and scalable architectures.",
    category: "Learning",
    status: "active",
    deadline: iso(-90),
    createdAt: iso(20),
    progress: 28,
    modules: [
      { _id: "m6", title: "Fundamentals", progress: 55, topics: [] },
      { _id: "m7", title: "Case Studies", progress: 12, topics: [] },
    ],
  },
  {
    _id: "g3",
    title: "Full-Stack Portfolio",
    description: "Ship 3 polished full-stack projects for placement portfolio.",
    category: "Projects",
    status: "paused",
    deadline: iso(-120),
    createdAt: iso(45),
    progress: 15,
    modules: [],
  },
];

export const allTasks: Task[] = [
  ...concepts.flatMap((c) => c.tasks),
  {
    _id: "t10",
    title: "Read chapter 3 of DBMS notes",
    priority: "medium",
    status: "todo",
    estimatedMinutes: 40,
    dueDate: iso(-1),
    goalId: "g1",
    goalTitle: "Crack TCS",
  },
  {
    _id: "t11",
    title: "Push weather-app repo to GitHub",
    priority: "high",
    status: "todo",
    estimatedMinutes: 20,
    goalId: "g3",
    goalTitle: "Full-Stack Portfolio",
  },
];

export const allResources: Resource[] = [
  ...concepts.flatMap((c) => c.resources),
  {
    _id: "r10",
    title: "System Design Primer",
    description: "GitHub repo covering distributed systems patterns.",
    type: "repo",
    url: "https://github.com",
    tags: ["system-design", "reference"],
    favorite: true,
    goalTitle: "Master System Design",
    createdAt: iso(5),
  },
  {
    _id: "r11",
    title: "MDN — JavaScript Closures",
    type: "link",
    url: "https://developer.mozilla.org",
    tags: ["javascript"],
    favorite: false,
    createdAt: iso(7),
  },
  {
    _id: "r12",
    title: "DBMS Cheat Sheet.pdf",
    type: "pdf",
    tags: ["dbms", "revision"],
    favorite: true,
    goalTitle: "Crack TCS",
    createdAt: iso(2),
  },
];

export const activities: ActivityLog[] = [
  { _id: "a1", actionType: "concept_opened", message: "Opened Percentage in Numerical Ability", createdAt: iso(0, 1) },
  { _id: "a2", actionType: "task_completed", message: "Completed 'Watch: Percentage shortcuts'", createdAt: iso(0, 3) },
  { _id: "a3", actionType: "resource_added", message: "Added PDF: TCS Sample Questions", createdAt: iso(0, 5) },
  { _id: "a4", actionType: "progress_logged", message: "Logged 45 min on Recursion", createdAt: iso(1) },
  { _id: "a5", actionType: "goal_updated", message: "Updated deadline for Crack TCS", createdAt: iso(2) },
  { _id: "a6", actionType: "note_saved", message: "Saved notes in Profit & Loss", createdAt: iso(3) },
];

export const progressLogs: ProgressLog[] = [
  { _id: "p1", title: "Percentage practice", category: "Aptitude", durationMinutes: 45, status: "completed", date: iso(0), goalTitle: "Crack TCS" },
  { _id: "p2", title: "Recursion problems", category: "DSA", durationMinutes: 60, status: "completed", date: iso(1), goalTitle: "Crack TCS" },
  { _id: "p3", title: "System Design reading", category: "Learning", durationMinutes: 30, status: "in_progress", date: iso(2), goalTitle: "Master System Design" },
  { _id: "p4", title: "Verbal ability quiz", category: "Aptitude", durationMinutes: 25, status: "completed", date: iso(3), goalTitle: "Crack TCS" },
  { _id: "p5", title: "Portfolio project setup", category: "Projects", durationMinutes: 90, status: "completed", date: iso(4), goalTitle: "Full-Stack Portfolio" },
];

// Weekly minutes for last 7 days
export const weeklyMinutes = [45, 90, 30, 120, 75, 60, 105];

export const dashboardSummary = {
  studentName: "Alex",
  totalGoals: goals.length,
  activeGoals: goals.filter((g) => g.status === "active").length,
  completedTasks: allTasks.filter((t) => t.status === "completed").length,
  pendingTasks: allTasks.filter((t) => t.status !== "completed").length,
  totalResources: allResources.length,
  totalStudyHours: Math.round(weeklyMinutes.reduce((a, b) => a + b, 0) / 60),
  streakDays: 12,
};

export const continueConcept = concepts[0];
export const todaysTasks = allTasks.filter((t) => t.status !== "completed").slice(0, 4);
export const quickResources = allResources.slice(0, 4);

export function getConceptById(id: string) {
  return concepts.find((c) => c._id === id);
}
export function getGoalById(id: string) {
  return goals.find((g) => g._id === id);
}
