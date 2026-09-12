import type { TaskPriority } from "../types/task";

export interface PriorityConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export const priorityConfigMap: Record<TaskPriority, PriorityConfig> = {
  LOW: {
    label: "Low",
    bg: "bg-slate-200",
    text: "text-slate-700 font-medium",
    border: "border-slate-300",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-slate-600",
    text: "text-white font-medium",
    border: "border-slate-600",
  },
  HIGH: {
    label: "High",
    bg: "bg-amber-500",
    text: "text-white font-medium",
    border: "border-amber-500",
  },
  CRITICAL: {
    label: "Critical",
    bg: "bg-rose-600",
    text: "text-white font-semibold",
    border: "border-rose-600",
  },
};
