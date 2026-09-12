import { Router } from "express";
import {
  createTaskHandler,
  listTasksHandler,
  getTaskByIdHandler,
  updateTaskStatusHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from "./tasks.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
  taskFilterQuerySchema,
} from "./tasks.validation.js";

const router = Router();

// All task routes require authentication
router.use(requireAuth);

// List tasks (supports ?status=&priority=&projectId=&dueFrom=&dueTo=)
router.get("/", validate({ query: taskFilterQuerySchema }), listTasksHandler);

// Get single task by ID
router.get("/:id", getTaskByIdHandler);

// Create task: Admin and Project Manager only
router.post(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validate({ body: createTaskSchema }),
  createTaskHandler
);

// Update task status: Admin, Project Owner PM, or Assigned Developer
router.patch(
  "/:id/status",
  validate({ body: updateTaskStatusSchema }),
  updateTaskStatusHandler
);

// Full task edit: Admin and PM only (service enforces ownership)
router.patch(
  "/:id",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validate({ body: updateTaskSchema }),
  updateTaskHandler
);

// Delete task: Admin and PM only (service enforces ownership)
router.delete("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), deleteTaskHandler);

export const taskRoutes = router;
