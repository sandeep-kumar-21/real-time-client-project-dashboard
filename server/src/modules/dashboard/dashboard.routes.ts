import { Router } from "express";
import { getDashboardMetricsHandler } from "./dashboard.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Single unified endpoint returning role-scoped metrics for Admin, PM, or Developer
router.get("/metrics", getDashboardMetricsHandler);

export const dashboardRoutes = router;
