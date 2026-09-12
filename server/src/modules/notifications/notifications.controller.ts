import { Request, Response } from "express";
import { notificationsService } from "./notifications.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const listNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await notificationsService.list(req.user!.id);
  res.status(200).json(ApiResponse.success(notifications));
});

export const getUnreadCountHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.getUnreadCount(req.user!.id);
  res.status(200).json(ApiResponse.success(result));
});

export const markAsReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationsService.markAsRead(req.params.id as string, req.user!.id);
  res.status(200).json(ApiResponse.success(notification, "Notification marked as read"));
});

export const markAllAsReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.markAllAsRead(req.user!.id);
  res.status(200).json(ApiResponse.success(result, "All notifications marked as read"));
});
