import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getDashboardMetricsHandler = asyncHandler(async (req: Request, res: Response) => {
  const metrics = await dashboardService.getMetrics(req.user!);
  res.status(200).json(ApiResponse.success(metrics));
});
