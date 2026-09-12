import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../auth/authStore";
import { dashboardApi } from "../../api/dashboard.api";
import { AdminDashboard } from "./AdminDashboard";
import { PmDashboard } from "./PmDashboard";
import { DeveloperDashboard } from "./DeveloperDashboard";
import { Skeleton } from "../../components/ui/Skeleton";
import { ProjectFormModal } from "../projects/ProjectFormModal";
import { TaskFormModal } from "../tasks/TaskFormModal";
import { ClientFormModal } from "../clients/ClientFormModal";
import { getSocket } from "../../lib/socket";
import type { AdminDashboardMetrics, PmDashboardMetrics, DeveloperDashboardMetrics } from "../../types/dashboard";

export const DashboardPage: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "metrics", user?.id],
    queryFn: () => dashboardApi.getMetrics(),
    staleTime: 30000,
    enabled: !!user?.id,
  });

  // Socket listener to invalidate dashboard metrics when any task/project event occurs
  useEffect(() => {
    if (!accessToken || !user?.id) return;
    const socket = getSocket(accessToken);

    const handleInvalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics", user.id] });
    };

    socket.on("task:status_changed", handleInvalidate);
    socket.on("task:created", handleInvalidate);
    socket.on("task:assigned", handleInvalidate);
    socket.on("task:overdue_flagged", handleInvalidate);
    socket.on("project:created", handleInvalidate);

    return () => {
      socket.off("task:status_changed", handleInvalidate);
      socket.off("task:created", handleInvalidate);
      socket.off("task:assigned", handleInvalidate);
      socket.off("task:overdue_flagged", handleInvalidate);
      socket.off("project:created", handleInvalidate);
    };
  }, [accessToken, user?.id, queryClient]);

  if (isLoading || (metrics && user && metrics.role !== user.role)) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 text-center space-y-3 bg-white rounded-xl border border-slate-200">
        <p className="text-sm font-semibold text-rose-600">Failed to load dashboard metrics</p>
        <button
          onClick={() => refetch()}
          className="text-xs text-indigo-600 underline font-medium hover:text-indigo-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {metrics.role === "ADMIN" && user?.role === "ADMIN" && (
        <AdminDashboard
          metrics={metrics as AdminDashboardMetrics}
          onOpenNewProject={() => setIsProjectModalOpen(true)}
          onOpenNewClient={() => setIsClientModalOpen(true)}
        />
      )}

      {metrics.role === "PROJECT_MANAGER" && user?.role === "PROJECT_MANAGER" && (
        <PmDashboard
          metrics={metrics as PmDashboardMetrics}
          onOpenNewTask={() => setIsTaskModalOpen(true)}
          onOpenNewProject={() => setIsProjectModalOpen(true)}
        />
      )}

      {metrics.role === "DEVELOPER" && user?.role === "DEVELOPER" && (
        <DeveloperDashboard
          metrics={metrics as DeveloperDashboardMetrics}
          onTaskUpdated={() => refetch()}
        />
      )}

      {/* Modals */}
      <ProjectFormModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }}
      />

      <ClientFormModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }}
      />
    </div>
  );
};
