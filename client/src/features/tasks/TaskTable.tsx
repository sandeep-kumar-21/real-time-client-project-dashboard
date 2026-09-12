import React from "react";
import type { Task, TaskStatus } from "../../types/task";
import { useAuthStore } from "../auth/authStore";
import { useQuery } from "@tanstack/react-query";
import { priorityConfigMap } from "../../utils/priorityColorMap";
import { statusConfigMap } from "../../utils/statusColorMap";
import { AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";
import { tasksApi } from "../../api/tasks.api";
import { authApi } from "../../api/auth.api";
import toast from "react-hot-toast";

interface TaskTableProps {
  tasks: Task[];
  onTaskUpdated: () => void;
  onDeleteTask?: (id: string) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onTaskUpdated,
  onDeleteTask,
}) => {
  const { user } = useAuthStore();

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      toast.success(`Status updated to ${statusConfigMap[newStatus].label}`);
      onTaskUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const canEditStatus = (task: Task) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (user.role === "PROJECT_MANAGER") {
      return task.project?.createdById === user.id;
    }
    if (user.role === "DEVELOPER") {
      return task.assignedToId === user.id;
    }
    return false;
  };

  const canDeleteTask = (task: Task) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (user.role === "PROJECT_MANAGER") {
      return task.project?.createdById === user.id;
    }
    return false;
  };

  const canAssignTask = (task: Task) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (user.role === "PROJECT_MANAGER") {
      return task.project?.createdById === user.id;
    }
    return false;
  };

  const { data: developers = [] } = useQuery({
    queryKey: ["developers-list"],
    queryFn: () => authApi.listUsers("DEVELOPER"),
  });

  const handleAssigneeChange = async (taskId: string, newAssignedToId: string) => {
    try {
      await tasksApi.update(taskId, {
        assignedToId: newAssignedToId || null,
      });
      const assignedDev = developers.find((d) => d.id === newAssignedToId);
      toast.success(
        assignedDev
          ? `Task assigned to ${assignedDev.name}`
          : "Task marked as unassigned"
      );
      onTaskUpdated();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to update task assignment"
      );
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">No tasks found</p>
        <p className="text-xs text-slate-400">
          Try adjusting your search filters or create a new sprint task.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[720px]">
          <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Task Details</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tasks.map((task) => {
              const priorityCfg = priorityConfigMap[task.priority];
              const statusCfg = statusConfigMap[task.status];
              const editable = canEditStatus(task);
              const deletable = canDeleteTask(task);

              return (
                <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Task details */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 leading-tight">
                      {task.title}
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                    {task.project?.name || "—"}
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {canAssignTask(task) ? (
                      <select
                        value={task.assignedToId || ""}
                        onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700 font-medium hover:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer max-w-[170px]"
                        title="Assign or reassign developer"
                      >
                        <option value="">Unassigned</option>
                        {developers.map((dev) => (
                          <option key={dev.id} value={dev.id}>
                            {dev.name}
                          </option>
                        ))}
                      </select>
                    ) : task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                          {task.assignedTo.name.charAt(0)}
                        </div>
                        <span className="text-slate-800 font-medium">
                          {task.assignedTo.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityCfg.border} ${priorityCfg.bg} ${priorityCfg.text}`}
                    >
                      {priorityCfg.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {editable ? (
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value as TaskStatus)
                        }
                        className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 hover:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusCfg.border} ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    )}
                  </td>

                  {/* Due Date & Overdue */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1.5">
                        {task.isOverdue && task.status !== "DONE" && (
                          <span
                            title="Flagged overdue by background BullMQ worker"
                            className="flex items-center gap-1 text-[10px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300"
                          >
                            <AlertTriangle className="w-3 h-3 text-slate-600" /> Overdue
                          </span>
                        )}
                        <span className="text-slate-600 font-mono text-[11px]">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No date</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {deletable && onDeleteTask && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete task"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
