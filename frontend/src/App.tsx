import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppController } from "@/components/prep/app-controller";
import { AppStoreProvider, useAppStore } from "@/lib/app-store";
import AuthPage from "@/routes/auth";
import ConceptWorkspace from "@/routes/concept.$conceptId";
import GoalsPage from "@/routes/goals";
import GoalDetail from "@/routes/goals.$goalId";
import Home from "@/routes/index";
import JourneyPage from "@/routes/journey";
import ProfilePage from "@/routes/profile";
import ResourcesPage from "@/routes/resources";
import SessionsPage from "@/routes/sessions";
import SettingsPage from "@/routes/settings";
import TasksPage from "@/routes/tasks";

const queryClient = new QueryClient();

function AuthGate() {
  const { isAuthed } = useAppStore();
  const location = useLocation();
  const isAuthRoute = location.pathname === "/auth";

  if (!isAuthed && !isAuthRoute) return <Navigate to="/auth" replace />;
  if (isAuthed && isAuthRoute) return <Navigate to="/" replace />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/goals/:goalId" element={<GoalDetail />} />
      <Route path="/concept/:conceptId" element={<ConceptWorkspace />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/sessions" element={<SessionsPage />} />
      <Route path="/journey" element={<JourneyPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <AppController>
          <AuthGate />
        </AppController>
      </AppStoreProvider>
    </QueryClientProvider>
  );
}
