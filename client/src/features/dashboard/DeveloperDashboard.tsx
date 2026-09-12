import React from "react";
import { Link } from "react-router-dom";
import type { DeveloperDashboardMetrics } from "../../types/dashboard";
import type { TaskStatus } from "../../types/task";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitPullRequest,
} from "lucide-react";
import { priorityConfigMap } from "../../utils/priorityColorMap";
import { statusConfigMap } from "../../utils/statusColorMap";
import { tasksApi } from "../../api/tasks.api";
import toast from "react-hot-toast";

interface DeveloperDashboardProps {
  metrics: DeveloperDashboardMetrics;
  onTaskUpdated?: () => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  metrics,
  onTaskUpdated,
}) => {
  const inProgressCount = metrics.tasksByStatus.IN_PROGRESS || 0;
  const inReviewCount = metrics.tasksByStatus.IN_REVIEW || 0;
  const doneCount = metrics.tasksByStatus.DONE || 0;
  const total = metrics.totalAssigned || 1;

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      toast.success(`Task status updated to ${statusConfigMap[newStatus].label}`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update task status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Developer Workspace
            <Badge variant="emerald" className="text-[10px]">Developer</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your personal sprint queue, assigned deliverables, and fast status transitions
          </p>
        </div>

        <Link to="/tasks" className="shrink-0 self-start sm:self-auto">
          <Badge variant="slate" className="text-xs py-1 px-3 cursor-pointer hover:bg-slate-200">
            View My Tasks Filter <ArrowRight className="w-3 h-3 ml-1 inline" />
          </Badge>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned to Me"
          value={metrics.totalAssigned}
          icon={<CheckSquare className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Total active tickets"
        />

        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={<Clock className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Currently coding / testing"
        />

        <StatCard
          label="Pending Review"
          value={inReviewCount}
          icon={<GitPullRequest className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Awaiting PR or PM sign-off"
        />

        <StatCard
          label="Completed"
          value={doneCount}
          icon={<CheckCircle2 className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Delivered sprint tasks"
        />
      </div>

      {/* Sprint Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">Sprint Delivery Rate</span>
            <span className="text-xs font-mono text-slate-500">
              {doneCount} / {metrics.totalAssigned} completed ({Math.round((doneCount / total) * 100)}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              style={{ width: `${(doneCount / total) * 100}%` }}
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assigned Tasks Action Table */}
      <Card>
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Active Work Queue</h2>
            <p className="text-[11px] text-slate-500">
              Sorted by severity (Critical & High priority first) and nearest due date
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {metrics.assignedTasks.length} active
          </span>
        </div>

        {metrics.assignedTasks.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">All caught up!</p>
            <p className="text-xs text-slate-400">You have no pending tasks assigned at this moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Task Title</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Quick Status Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metrics.assignedTasks.map((task) => {
                  const priorityCfg = priorityConfigMap[task.priority];

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {task.project?.name || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityCfg.border} ${priorityCfg.bg} ${priorityCfg.text}`}
                        >
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {task.dueDate ? (
                          <div className="flex items-center gap-1.5">
                            {task.isOverdue && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                                <AlertTriangle className="w-3 h-3 text-slate-600" /> Overdue
                              </span>
                            )}
                            <span className="text-slate-600 font-mono text-[11px]">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No deadline</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 hover:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="DONE">Done</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
