import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../../api/tasks.api";
import type { TaskFilterParams } from "../../api/tasks.api";
import { projectsApi } from "../../api/projects.api";
import { TaskFilters } from "./TaskFilters";
import { TaskTable } from "./TaskTable";
import { TaskFormModal } from "./TaskFormModal";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAuthStore } from "../auth/authStore";
import { getSocket } from "../../lib/socket";
import { Plus, CheckSquare, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import type { TaskPriority, TaskStatus } from "../../types/task";

export const TasksPage: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const status = searchParams.get("status") as TaskStatus | null;
  const priority = searchParams.get("priority") as TaskPriority | null;
  const projectId = searchParams.get("projectId") || undefined;
  const dueFrom = searchParams.get("dueFrom") || undefined;
  const dueTo = searchParams.get("dueTo") || undefined;

  const filterParams: TaskFilterParams = {
    status: status || undefined,
    priority: priority || undefined,
    projectId,
    dueFrom,
    dueTo,
  };

  // Query tasks based on shareable URL filters
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
    isFetching,
  } = useQuery({
    queryKey: ["tasks", filterParams],
    queryFn: () => tasksApi.list(filterParams),
  });

  // Query projects for filter dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  // Real-time socket event sync
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handleTaskEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    };

    socket.on("task:status_changed", handleTaskEvent);
    socket.on("task:created", handleTaskEvent);
    socket.on("task:updated", handleTaskEvent);
    socket.on("task:deleted", handleTaskEvent);
    socket.on("task:overdue_flagged", handleTaskEvent);

    return () => {
      socket.off("task:status_changed", handleTaskEvent);
      socket.off("task:created", handleTaskEvent);
      socket.off("task:updated", handleTaskEvent);
      socket.off("task:deleted", handleTaskEvent);
      socket.off("task:overdue_flagged", handleTaskEvent);
    };
  }, [accessToken, queryClient]);

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await tasksApi.delete(taskId);
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  const canCreateTask = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-slate-600" />
            {user?.role === "DEVELOPER" ? "My Sprint Tasks" : "Task Management"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === "DEVELOPER"
              ? "All deliverables assigned directly to you with live status sync"
              : "Full sprint pipeline with multi-variable filters and real-time updates"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => refetchTasks()}
            isLoading={isFetching}
            title="Refresh tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>

          {canCreateTask && (
            <Button size="sm" variant="primary" onClick={() => setIsNewTaskOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar (Synchronized with URL params) */}
      <TaskFilters projects={projects} />

      {/* Task List */}
      {isLoadingTasks ? (
        <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <TaskTable
          tasks={tasks || []}
          onTaskUpdated={() => refetchTasks()}
          onDeleteTask={canCreateTask ? handleDeleteTask : undefined}
        />
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }}
        defaultProjectId={projectId}
      />
    </div>
  );
};
