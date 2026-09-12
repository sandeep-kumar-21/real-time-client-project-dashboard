import { Request, Response } from "express";
import { activityService } from "./activity.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getFeedHandler = asyncHandler(async (req: Request, res: Response) => {
  const feed = await activityService.getFeed(
    {
      projectId: req.query.projectId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    },
    req.user!
  );

  res.status(200).json(ApiResponse.success(feed));
});
