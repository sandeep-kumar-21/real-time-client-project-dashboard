import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { activityApi } from "../../api/activity.api";
import { projectsApi } from "../../api/projects.api";
import { ActivityFeedItem } from "./ActivityFeedItem";
import type { ActivityLog } from "../../types/activity";
import { useAuthStore } from "../auth/authStore";
import { getSocket } from "../../lib/socket";
import { Activity, Filter, RefreshCw } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";

export const ActivityPage: React.FC = () => {
  const { accessToken, user } = useAuthStore();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [liveLogs, setLiveLogs] = useState<ActivityLog[]>([]);

  // Fetch initial offline catch-up logs from database
  const { data: initialLogs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["activity", selectedProjectId],
    queryFn: () => activityApi.getFeed({ projectId: selectedProjectId || undefined, limit: 40 }),
  });

  // Query projects for filter dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  // Reset live logs when filter changes so we don't mix projects
  useEffect(() => {
    setLiveLogs([]);
  }, [selectedProjectId]);

  // Join selected project room for focused real-time updates
  useEffect(() => {
    if (!accessToken || !selectedProjectId) return;
    const socket = getSocket(accessToken);
    socket.emit("join:project", selectedProjectId);
    return () => {
      socket.emit("leave:project", selectedProjectId);
    };
  }, [accessToken, selectedProjectId]);

  // Real-time live activity ingestion via WebSocket
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handleNewActivity = (newLog: ActivityLog) => {
      // If a project filter is active, only add if it matches
      if (selectedProjectId && newLog.projectId !== selectedProjectId) {
        return;
      }

      setLiveLogs((prev) => {
        // Avoid duplicate if already present
        if (prev.some((l) => l.id === newLog.id)) return prev;
        return [newLog, ...prev];
      });
    };

    socket.on("activity:new", handleNewActivity);

    return () => {
      socket.off("activity:new", handleNewActivity);
    };
  }, [accessToken, selectedProjectId]);

  // Merge live logs with initial logs (deduplicating by id)
  const combinedLogs = React.useMemo(() => {
    const map = new Map<string, ActivityLog>();
    liveLogs.forEach((l) => map.set(l.id, l));
    initialLogs.forEach((l) => {
      if (!map.has(l.id)) {
        map.set(l.id, l);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [liveLogs, initialLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-slate-600" />
            Live Activity Feed
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit log of sprint status transitions, assignments, and deliverables
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Socket.io Stream Active</span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Project Filter (if user is Admin or PM) */}
      {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
        <div className="flex items-center gap-2 w-full sm:max-w-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="">All Projects Activity</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Activity Timeline List */}
      {isLoading ? (
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : combinedLogs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <Activity className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No activity recorded yet</p>
          <p className="text-xs text-slate-400">
            Task status transitions and milestone progress will stream here live.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {combinedLogs.map((log) => (
            <ActivityFeedItem key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
};
