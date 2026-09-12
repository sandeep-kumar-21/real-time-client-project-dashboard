import { Router } from "express";
import {
  listNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
} from "./notifications.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listNotificationsHandler);
router.get("/unread-count", getUnreadCountHandler);
router.patch("/:id/read", markAsReadHandler);
router.patch("/read-all", markAllAsReadHandler);

export const notificationRoutes = router;
