import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Authentication token required", "MISSING_TOKEN");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Access token has expired", "TOKEN_EXPIRED");
    }
    throw ApiError.unauthorized("Invalid authentication token", "INVALID_TOKEN");
  }
};
