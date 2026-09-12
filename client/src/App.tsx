import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./lib/queryClient";

import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { RoleGuard } from "./features/auth/RoleGuard";
import { LoginForm } from "./features/auth/LoginForm";
import { useAuthStore } from "./features/auth/authStore";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { TasksPage } from "./features/tasks/TasksPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { ClientsPage } from "./features/clients/ClientsPage";
import { UsersPage } from "./features/users/UsersPage";
import { ActivityPage } from "./features/activity/ActivityPage";

export const App: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const rightOffset = user?.role === "ADMIN" ? 215 : user ? 76 : 16;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginForm />} />

          {/* Authenticated Application Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* Unified Dashboard (Adapts based on User Role: Admin / PM / Developer) */}
            <Route index element={<DashboardPage />} />

            {/* Projects Management (Admin & PM only) */}
            <Route
              path="projects"
              element={
                <RoleGuard allowedRoles={["ADMIN", "PROJECT_MANAGER"]}>
                  <ProjectsPage />
                </RoleGuard>
              }
            />

            {/* Clients Management (Admin & PM only; Devs restricted) */}
            <Route
              path="clients"
              element={
                <RoleGuard allowedRoles={["ADMIN", "PROJECT_MANAGER"]}>
                  <ClientsPage />
                </RoleGuard>
              }
            />

            {/* Users Management (Admin only) */}
            <Route
              path="users"
              element={
                <RoleGuard allowedRoles={["ADMIN"]}>
                  <UsersPage />
                </RoleGuard>
              }
            />

            {/* Tasks Workstream (All roles, server-scoped) */}
            <Route path="tasks" element={<TasksPage />} />

            {/* Real-Time Activity Feed (All roles) */}
            <Route path="activity" element={<ActivityPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Global Notification Toast Container */}
      <Toaster
        position="top-right"
        containerStyle={{
          top: 12,
          right: rightOffset,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: "13px",
            borderRadius: "8px",
            padding: "10px 14px",
            border: "1px solid #334155",
            maxWidth: "min(400px, calc(100vw - 250px))",
          },
        }}
      />
    </QueryClientProvider>
  );
};

export default App;
