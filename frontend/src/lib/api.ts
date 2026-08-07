import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const apiClient = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string> {
  try {
    const { data } = await apiClient.post<{ accessToken: string }>("/api/auth/refresh-token");
    const newToken = data.accessToken;
    
    localStorage.setItem('ph_token', newToken);
    localStorage.setItem('ph_auth', '1');
    
    return newToken;
  } catch (error) {
    localStorage.removeItem('ph_token');
    localStorage.setItem('ph_auth', '0');
    throw error;
  }
}

function getErrorMessage(status: number, data: Record<string, unknown>): string {
  if (status === 401) {
    return "Authentication required. Please sign in to continue.";
  }

  if (status === 400) {
    return typeof data.message === "string" && data.message.trim()
      ? data.message
      : "Please fill in all required fields.";
  }

  if (status === 404) {
    return typeof data.message === "string" && data.message.trim()
      ? data.message
      : "The requested item could not be found.";
  }

  return typeof data.message === "string" && data.message.trim()
    ? data.message
    : "Request failed";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("ph_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: AxiosRequestConfig = {
    url: path,
    method: options.method,
    headers,
    data: typeof options.body === "string" ? JSON.parse(options.body) : options.body,
  };

  try {
    return (await apiClient.request<T>(config)).data;
  } catch (caught) {
    const error = caught as AxiosError<Record<string, unknown>>;
    if (error.response?.status !== 401 || path.includes("/auth/")) {
      throw new Error(getErrorMessage(error.response?.status ?? 0, error.response?.data ?? {}));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken: string) => {
          apiClient
            .request<T>({ ...config, headers: { ...headers, Authorization: `Bearer ${newToken}` } })
            .then((response) => resolve(response.data))
            .catch(reject);
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      onTokenRefreshed(newToken);
      
      return (await apiClient.request<T>({
        ...config,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      })).data;
    } catch {
      isRefreshing = false;
      throw new Error('Session expired. Please sign in again.');
    } finally {
      isRefreshing = false;
    }
  }
}

export async function loginUser(email: string, password: string) {
  return request<{ message: string; user: { username: string; email: string }; accessToken: string }> ("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(email: string, password: string, username: string) {
  return request<{ message: string; user: { username: string; email: string; verified: boolean } }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function verifyEmailApi(email: string, otp: string) {
  return request<{ message: string; user: { username: string; email: string; verified: boolean } }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function getGoals() {
  return request<{
    goals: Array<{
      _id: string;
      title: string;
      description: string;
      status: string;
      targetDate?: string;
      createdAt?: string;
      updatedAt?: string;
      modules?: Array<{ _id: string; title: string; touched: number; total: number }>;
    }>;
  }>("/api/goals", {
    method: "GET",
  });
}

export async function getResources() {
  return request<{
    resources: Array<{
      _id: string;
      title: string;
      description?: string;
      type: string;
      url?: string;
      tags?: string[];
      favourite?: boolean;
      createdAt?: string;
      updatedAt?: string;
      goalId?: string;
      conceptId?: string;
      conceptPath?: string;
      breadcrumb?: string;
    }>;
  }>('/api/resources', {
    method: 'GET',
  });
}

export async function createResourceApi(data: {
  title: string;
  type?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  favorite?: boolean;
  goalId?: string;
  conceptId?: string;
}) {
  const body: Record<string, unknown> = {
    title: data.title,
    description: data.notes || '',
    type: data.type || 'Other',
    url: data.url || '',
    tags: data.tags || [],
    favourite: data.favorite || false,
  };

  if (data.conceptId) {
    body.conceptId = data.conceptId;
  }

  if (data.goalId) {
    body.goalId = data.goalId;
  }

  return request<{
    resource: {
      _id: string;
      title: string;
      description?: string;
      type: string;
      url?: string;
      tags?: string[];
      favourite?: boolean;
      createdAt: string;
      goalId?: string;
      conceptId?: string;
    };
  }>('/api/resources', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateResourceApi(id: string, data: {
  title?: string;
  type?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  favorite?: boolean;
  goalId?: string;
}) {
  return request<{
    resource: {
      _id: string;
      title: string;
      description?: string;
      type: string;
      url?: string;
      tags?: string[];
      favourite?: boolean;
      createdAt: string;
      updatedAt?: string;
      goalId?: string;
      conceptId?: string;
    };
  }>(`/api/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: data.title,
      description: data.notes,
      type: data.type,
      url: data.url,
      tags: data.tags,
      favourite: data.favorite,
      goalId: data.goalId,
    }),
  });
}

export async function updateGoalApi(id: string, data: {
  title?: string;
  description?: string;
  targetDate?: string;
  status?: string;
}) {
  return request<{
    message: string;
    goal: {
      _id: string;
      title: string;
      description: string;
      status: string;
      targetDate?: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
  }>(`/api/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      targetDate: data.targetDate,
      status: data.status,
    }),
  });
}

export async function deleteGoalApi(id: string) {
  return request<{ message: string }>(`/api/goals/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteResourceApi(id: string) {
  return request<{ message: string }>(`/api/resources/${id}`, {
    method: 'DELETE',
  });
}

export async function createGoalApi(data: {
  title: string;
  description?: string;
  targetDate?: string;
  status?: string;
}) {
  return request<{
    message: string;
    goal: {
      _id: string;
      title: string;
      description: string;
      status: string;
      targetDate?: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
  }>('/api/goals', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      description: data.description || '',
      targetDate: data.targetDate,
      status: data.status || 'active',
    }),
  });
}

export async function createStudySessionApi(data: {
  conceptId: string;
  duration: number;
  startedAt?: number;
  endedAt?: string;
}) {
  return request<{ message: string; session: { _id: string; conceptId: string; duration: number; startedAt?: string; endedAt?: string; date?: string } }>("/api/study-sessions", {
    method: "POST",
    body: JSON.stringify({
      conceptId: data.conceptId,
      duration: data.duration,
      startedAt: data.startedAt ? new Date(data.startedAt).toISOString() : new Date().toISOString(),
      endedAt: data.endedAt || new Date().toISOString(),
    }),
  });
}

export async function getStudySessionsApi() {
  return request<{ sessions: Array<{ _id: string; conceptId: string; duration: number; startedAt?: string; endedAt?: string; date?: string }> }>('/api/study-sessions', {
    method: 'GET',
  });
}
