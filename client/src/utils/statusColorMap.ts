import type { TaskStatus } from "../types/task";

export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  barColor: string;
}

export const statusConfigMap: Record<TaskStatus, StatusConfig> = {
  TODO: {
    label: "To Do",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200/80",
    dot: "bg-slate-400",
    barColor: "bg-slate-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200/80",
    dot: "bg-blue-500",
    barColor: "bg-blue-500",
  },
  IN_REVIEW: {
    label: "In Review",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200/80",
    dot: "bg-amber-500",
    barColor: "bg-amber-500",
  },
  DONE: {
    label: "Done",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200/80",
    dot: "bg-emerald-500",
    barColor: "bg-emerald-500",
  },
};
