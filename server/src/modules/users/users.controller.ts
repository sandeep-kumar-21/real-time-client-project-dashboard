import { Request, Response } from "express";
import { usersService } from "./users.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const listUsersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await usersService.listUsers();
  res.status(200).json(ApiResponse.success(users));
});

export const getUserByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getById(req.params.id as string);
  res.status(200).json(ApiResponse.success(user));
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.createUser(req.body);
  res.status(201).json(ApiResponse.success(user, "User created successfully"));
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateUser(req.params.id as string, req.body);
  res.status(200).json(ApiResponse.success(user, "User updated successfully"));
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersService.deleteUser(req.params.id as string, req.user!.id);
  res.status(200).json(ApiResponse.success(result, "User deleted successfully"));
});

