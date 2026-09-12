import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project ID is required"),
  assignedToId: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    message: "Status must be TODO, IN_PROGRESS, IN_REVIEW, or DONE",
  }),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const taskFilterQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  projectId: z.string().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterQuery = z.infer<typeof taskFilterQuerySchema>;
