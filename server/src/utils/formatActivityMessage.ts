import { TaskStatus } from "@prisma/client";

const formatStatus = (status: TaskStatus | null | undefined): string => {
  switch (status) {
    case "TODO":
      return "To Do";
    case "IN_PROGRESS":
      return "In Progress";
    case "IN_REVIEW":
      return "In Review";
    case "DONE":
      return "Done";
    default:
      return status || "Unknown";
  }
};

export const formatActivityMessage = (
  userName: string,
  taskTitle: string,
  fromStatus: TaskStatus | null | undefined,
  toStatus: TaskStatus | null | undefined,
  assigneeName?: string | null
): string => {
  const fromFormatted = formatStatus(fromStatus);
  const toFormatted = formatStatus(toStatus);

  if (!fromStatus) {
    if (assigneeName) {
      return `${userName} created task "${taskTitle}" in ${toFormatted} and assigned to ${assigneeName}`;
    }
    return `${userName} created task "${taskTitle}" in ${toFormatted}`;
  }

  return `${userName} moved Task "${taskTitle}" from ${fromFormatted} → ${toFormatted}`;
};
