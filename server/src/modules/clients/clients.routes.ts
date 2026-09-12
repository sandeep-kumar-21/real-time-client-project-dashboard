import { Router } from "express";
import {
  createClientHandler,
  listClientsHandler,
  getClientByIdHandler,
  updateClientHandler,
  deleteClientHandler,
} from "./clients.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createClientSchema, updateClientSchema } from "./clients.validation.js";

const router = Router();

// All client endpoints require authentication
router.use(requireAuth);

// Admin & PM can view client list (for project creation assignment)
router.get("/", requireRole("ADMIN", "PROJECT_MANAGER"), listClientsHandler);

// Only Admin can manage clients (details, create, update, delete)
router.get("/:id", requireRole("ADMIN"), getClientByIdHandler);

router.post(
  "/",
  requireRole("ADMIN"),
  validate({ body: createClientSchema }),
  createClientHandler
);

router.put(
  "/:id",
  requireRole("ADMIN"),
  validate({ body: updateClientSchema }),
  updateClientHandler
);

router.delete("/:id", requireRole("ADMIN"), deleteClientHandler);

export const clientRoutes = router;
