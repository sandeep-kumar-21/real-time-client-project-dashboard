import React from "react";
import type { PmDashboardMetrics } from "../../types/dashboard";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  FolderKanban,
  CheckSquare,
  Calendar,
  AlertCircle,
  Plus,
  Clock,
} from "lucide-react";
import { priorityConfigMap } from "../../utils/priorityColorMap";
import { statusConfigMap } from "../../utils/statusColorMap";
import type { TaskPriority, TaskStatus } from "../../types/task";

interface PmDashboardProps {
  metrics: PmDashboardMetrics;
  onOpenNewTask?: () => void;
  onOpenNewProject?: () => void;
}

export const PmDashboard: React.FC<PmDashboardProps> = ({
  metrics,
  onOpenNewTask,
  onOpenNewProject,
}) => {
  const totalTasks = Object.values(metrics.tasksByStatus).reduce((a, b) => a + b, 0) || 1;
  const criticalCount = (metrics.tasksByPriority.CRITICAL || 0) + (metrics.tasksByPriority.HIGH || 0);

  const priorityKeys: TaskPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const statusKeys: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Project Management Hub
            <Badge variant="amber" className="text-[10px]">Project Manager</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scoped visibility for your assigned projects, sprint deliverables, and team workload
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenNewProject && (
            <Button size="sm" variant="secondary" onClick={onOpenNewProject} className="w-full sm:w-auto">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Project
            </Button>
          )}
          {onOpenNewTask && (
            <Button size="sm" variant="primary" onClick={onOpenNewTask} className="w-full sm:w-auto">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Managed Projects"
          value={metrics.totalProjects}
          icon={<FolderKanban className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Owned client projects"
        />

        <StatCard
          label="Total Active Tasks"
          value={totalTasks}
          icon={<CheckSquare className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Across your projects"
        />

        <StatCard
          label="Due This Week"
          value={metrics.dueThisWeek.length}
          icon={<Calendar className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Upcoming milestone deadlines"
        />

        <StatCard
          label="High / Critical"
          value={criticalCount}
          icon={<AlertCircle className="w-5 h-5 text-slate-600" />}
          variant="default"
          subtitle="Needs close team tracking"
        />
      </div>

      {/* Two Column Section: Pipeline Breakdown & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Task Status Distribution</h2>
            
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex mb-4">
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

            <div className="grid grid-cols-2 gap-2">
              {statusKeys.map((status) => {
                const count = metrics.tasksByStatus[status] || 0;
                const cfg = statusConfigMap[status];
                return (
                  <div key={status} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Priority Severity Matrix</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {priorityKeys.map((priority) => {
                const count = metrics.tasksByPriority[priority] || 0;
                const cfg = priorityConfigMap[priority];
                return (
                  <div
                    key={priority}
                    className={`p-3 rounded-lg border ${cfg.border} ${cfg.bg} flex items-center justify-between`}
                  >
                    <span className={`text-xs font-semibold ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    <span className={`text-base font-bold ${cfg.text}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due This Week Table */}
      <Card>
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Deliverables Due in Next 7 Days</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {metrics.dueThisWeek.length} upcoming
          </span>
        </div>

        {metrics.dueThisWeek.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No tasks scheduled for delivery in the next 7 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Task Title</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4">Assignee</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metrics.dueThisWeek.map((task) => {
                  const statusCfg = statusConfigMap[task.status];
                  const priorityCfg = priorityConfigMap[task.priority];

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {task.title}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {task.project?.name || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              {task.assignedTo.name.charAt(0)}
                            </div>
                            <span className="text-slate-800">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityCfg.border} ${priorityCfg.bg} ${priorityCfg.text}`}
                        >
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${statusCfg.border} ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
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

