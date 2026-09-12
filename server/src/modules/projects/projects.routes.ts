import { Router } from "express";
import {
  createProjectHandler,
  listProjectsHandler,
  getProjectByIdHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from "./projects.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createProjectSchema, updateProjectSchema } from "./projects.validation.js";

const router = Router();

// All project routes require authentication
router.use(requireAuth);

// List projects (scoped by role inside service)
router.get("/", listProjectsHandler);

// Get single project (scoped by role inside service)
router.get("/:id", getProjectByIdHandler);

// Create project: Admin and Project Manager only
router.post(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validate({ body: createProjectSchema }),
  createProjectHandler
);

// Update project: Admin and Project Manager (service enforces ownership for PM)
router.put(
  "/:id",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validate({ body: updateProjectSchema }),
  updateProjectHandler
);

// Delete project: Admin and Project Manager (service enforces ownership for PM)
router.delete("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), deleteProjectHandler);

export const projectRoutes = router;
