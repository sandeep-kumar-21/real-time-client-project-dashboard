import { Request, Response } from "express";
import { projectsService } from "./projects.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.create(req.body, req.user!);
  res.status(201).json(ApiResponse.success(project, "Project created successfully"));
});

export const listProjectsHandler = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectsService.list(req.user!);
  res.status(200).json(ApiResponse.success(projects));
});

export const getProjectByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.getById(req.params.id as string, req.user!);
  res.status(200).json(ApiResponse.success(project));
});

export const updateProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.update(req.params.id as string, req.body, req.user!);
  res.status(200).json(ApiResponse.success(project, "Project updated successfully"));
});

export const deleteProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectsService.delete(req.params.id as string, req.user!);
  res.status(200).json(ApiResponse.success(result, "Project deleted successfully"));
});
