import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required", "UNAUTHENTICATED");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Access denied. Role ${req.user.role} does not have required permissions: [${allowedRoles.join(", ")}]`,
        "INSUFFICIENT_ROLE_PERMISSIONS"
      );
    }

    next();
  };
};
