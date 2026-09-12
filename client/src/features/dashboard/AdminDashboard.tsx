import React from "react";
import { Link } from "react-router-dom";
import type { AdminDashboardMetrics } from "../../types/dashboard";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  FolderKanban,
  Users,
  CheckSquare,
  AlertTriangle,
  Radio,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { statusConfigMap } from "../../utils/statusColorMap";
import type { TaskStatus } from "../../types/task";
import { usePresenceStore } from "../activity/presenceStore";

interface AdminDashboardProps {
  metrics: AdminDashboardMetrics;
  onOpenNewProject?: () => void;
  onOpenNewClient?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  metrics,
  onOpenNewProject,
  onOpenNewClient,
}) => {
  const onlineCount = usePresenceStore((s) => s.onlineCount);
  const activeUsers = onlineCount || metrics.activeUsersOnline || 1;

  const totalTasks = metrics.totalTasks || 1;
  const statusKeys: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            System Administration Overview
            <Badge variant="indigo" className="text-[10px]">Administrator</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Global real-time visibility across all clients, projects, tasks, and system activity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenNewClient && (
            <Button size="sm" variant="secondary" onClick={onOpenNewClient} className="w-full sm:w-auto">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Client
            </Button>
          )}
          {onOpenNewProject && (
            <Button size="sm" variant="primary" onClick={onOpenNewProject} className="w-full sm:w-auto">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Projects"
          value={metrics.totalProjects}
          icon={<FolderKanban className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Active client engagements"
        />

        <StatCard
          label="Active Clients"
          value={metrics.totalClients}
          icon={<Users className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Enterprise accounts"
        />

        <StatCard
          label="Total Tasks"
          value={metrics.totalTasks}
          icon={<CheckSquare className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Across all projects"
        />

        <StatCard
          label="Overdue Tasks"
          value={metrics.overdueCount}
          icon={<AlertTriangle className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle={
            metrics.overdueCount > 0
              ? "Flagged by BullMQ worker"
              : "All tasks on schedule"
          }
        />

        <StatCard
          label="Live Presence"
          value={activeUsers}
          icon={<Radio className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Active socket connections"
        />
      </div>

      {/* Overdue Warning Alert if overdue tasks exist */}
      {metrics.overdueCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-900">
                {metrics.overdueCount} Task{metrics.overdueCount > 1 ? "s" : ""} Overdue
              </p>
              <p className="text-xs text-rose-700">
                Automated BullMQ worker flagged overdue deliverables requiring escalation.
              </p>
            </div>
          </div>
          <Link to="/tasks" className="w-full sm:w-auto shrink-0">
            <Button size="sm" variant="danger" className="w-full sm:w-auto">
              Inspect Overdue Tasks
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Status Distribution Breakdown */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Task Pipeline Breakdown</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {metrics.totalTasks} Total Deliverables
            </span>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex mb-6">
            {statusKeys.map((status) => {
              const count = metrics.tasksByStatus[status] || 0;
              const cfg = statusConfigMap[status];
              return (
                <div
                  key={status}
                  style={{ width: `${(count / totalTasks) * 100}%` }}
                  className={`${cfg.barColor} transition-all duration-500`}
                  title={`${cfg.label}: ${count}`}
                />
              );
            })}
          </div>

          {/* Breakdown Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statusKeys.map((status) => {
              const count = metrics.tasksByStatus[status] || 0;
              const pct = Math.round((count / totalTasks) * 100);
              const cfg = statusConfigMap[status];

              return (
                <div
                  key={status}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{pct}%</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/projects"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all group flex items-start justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Manage Projects
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure scopes, assign PMs, and link enterprise clients
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1" />
        </Link>

        <Link
          to="/tasks"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all group flex items-start justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Task Workstream
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Filter by project, priority, and assignees with live status syncing
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1" />
        </Link>

        <Link
          to="/activity"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all group flex items-start justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Live Activity Stream
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Socket.io audit trail and status change events
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1" />
        </Link>
      </div>
    </div>
  );
};
