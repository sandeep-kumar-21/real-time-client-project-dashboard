import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  getMeHandler,
  listUsersHandler,
} from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), registerHandler);
router.post("/login", validate({ body: loginSchema }), loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);
router.get("/me", requireAuth, getMeHandler);
router.get("/users", requireAuth, listUsersHandler);

export const authRoutes = router;
