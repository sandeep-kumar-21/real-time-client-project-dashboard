import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { tasksApi } from "../../api/tasks.api";
import { projectsApi } from "../../api/projects.api";
import { authApi } from "../../api/auth.api";
import type { Project } from "../../types/project";
import type { TaskPriority } from "../../types/task";
import toast from "react-hot-toast";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();

  useEffect(() => {
    if (isOpen) {
      setIsLoadingMeta(true);
      Promise.all([projectsApi.list(), authApi.listUsers("DEVELOPER")])
        .then(([projectsData, usersData]) => {
          setProjects(projectsData);
          setUsers(usersData);
          if (projectsData.length > 0 && !projectId) {
            setProjectId(defaultProjectId || projectsData[0].id);
          }
        })
        .catch((err) => {
          console.error("Failed to load task creation metadata:", err);
        })
        .finally(() => setIsLoadingMeta(false));
    }
  }, [isOpen, defaultProjectId, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) {
      toast.error("Title and project are required");
      return;
    }

    if (dueDate && dueDate < todayStr) {
      toast.error("Due date cannot be in the past");
      return;
    }

    setIsSubmitting(true);
    try {
      await tasksApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        assignedToId: assignedToId || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      toast.success("Task created successfully");
      setTitle("");
      setDescription("");
      setAssignedToId("");
      setPriority("MEDIUM");
      setDueDate("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Sprint Task" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g. Implement WebSocket heartbeat retry logic"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Technical details, acceptance criteria, edge cases..."
            rows={3}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            disabled={isLoadingMeta}
          >
            {projects.length === 0 ? (
              <option value="">{isLoadingMeta ? "Loading..." : "No projects available"}</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            )}
          </Select>

          <Select
            label="Assignee (Developer)"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            disabled={isLoadingMeta}
          >
            <option value="">Unassigned</option>
            {users
              .filter((u) => u.role === "DEVELOPER")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>

          <Input
            label="Due Date"
            type="date"
            min={todayStr}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={projects.length === 0} className="w-full sm:w-auto">
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

