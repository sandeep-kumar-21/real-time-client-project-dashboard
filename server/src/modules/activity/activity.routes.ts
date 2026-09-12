import { Router } from "express";
import { getFeedHandler } from "./activity.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// All activity feed requests require authentication
router.use(requireAuth);

// GET /api/activity/feed?projectId=&limit=20
router.get("/feed", getFeedHandler);

export const activityRoutes = router;
