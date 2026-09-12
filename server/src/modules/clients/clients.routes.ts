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

// Admin & PM can view clients
router.get("/", requireRole("ADMIN", "PROJECT_MANAGER"), listClientsHandler);
router.get("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), getClientByIdHandler);

// Admin & PM can create/update clients
router.post(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validate({ body: createClientSchema }),
  createClientHandler
);

router.put(
  "/:id",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validate({ body: updateClientSchema }),
  updateClientHandler
);

// Only Admin can delete clients
router.delete("/:id", requireRole("ADMIN"), deleteClientHandler);

export const clientRoutes = router;
