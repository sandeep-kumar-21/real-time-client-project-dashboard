import { Request, Response } from "express";
import { clientsService } from "./clients.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createClientHandler = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.create(req.body);
  res.status(201).json(ApiResponse.success(client, "Client created successfully"));
});

export const listClientsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const clients = await clientsService.list();
  res.status(200).json(ApiResponse.success(clients));
});

export const getClientByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.getById(req.params.id as string);
  res.status(200).json(ApiResponse.success(client));
});

export const updateClientHandler = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.update(req.params.id as string, req.body);
  res.status(200).json(ApiResponse.success(client, "Client updated successfully"));
});

export const deleteClientHandler = asyncHandler(async (req: Request, res: Response) => {
  const cascade = req.query.cascade === "true";
  const result = await clientsService.delete(req.params.id as string, cascade);
  res.status(200).json(ApiResponse.success(result, "Client deleted successfully"));
});
