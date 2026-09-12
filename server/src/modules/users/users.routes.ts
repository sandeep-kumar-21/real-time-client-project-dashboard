import { Router } from "express";
import {
  listUsersHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createUserSchema, updateUserSchema } from "./users.validation.js";

const router = Router();

// All user management routes require ADMIN role
router.use(requireAuth);
router.use(requireRole("ADMIN"));

router.get("/", listUsersHandler);
router.get("/:id", getUserByIdHandler);
router.post("/", validate({ body: createUserSchema }), createUserHandler);
router.patch("/:id", validate({ body: updateUserSchema }), updateUserHandler);
router.put("/:id", validate({ body: updateUserSchema }), updateUserHandler);
router.delete("/:id", deleteUserHandler);

export const userRoutes = router;
