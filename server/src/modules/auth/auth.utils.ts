import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { Role } from "@prisma/client";
import { env } from "../../config/env.js";
import { AuthenticatedUser } from "../../@types/express.js";

export const generateAccessToken = (user: { id: string; role: Role; email: string }): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      jti: crypto.randomUUID(),
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    }
  );
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString("hex");
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyAccessToken = (token: string): AuthenticatedUser => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUser;
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};
