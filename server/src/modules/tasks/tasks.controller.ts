import { Request, Response } from "express";
import { tasksService } from "./tasks.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.create(req.body, req.user!);
  res.status(201).json(ApiResponse.success(task, "Task created successfully"));
});

export const listTasksHandler = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await tasksService.list(req.query as any, req.user!);
  res.status(200).json(ApiResponse.success(tasks));
});

export const getTaskByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.getById(req.params.id as string, req.user!);
  res.status(200).json(ApiResponse.success(task));
});

export const updateTaskStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await tasksService.updateStatus(req.params.id as string, req.body.status, req.user!);
  res.status(200).json(ApiResponse.success(result, "Task status updated successfully"));
});

export const updateTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.update(req.params.id as string, req.body, req.user!);
  res.status(200).json(ApiResponse.success(task, "Task updated successfully"));
});

export const deleteTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await tasksService.delete(req.params.id as string, req.user!);
  res.status(200).json(ApiResponse.success(result, "Task deleted successfully"));
});
