import { formatDistanceToNow, parseISO } from "date-fns";

export const formatRelativeTime = (dateStr?: string | Date | null): string => {
  if (!dateStr) return "";
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
};
