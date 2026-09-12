import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { authService } from "./auth.service.js";
import { setRefreshTokenCookie, clearRefreshTokenCookie } from "./auth.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  // Set HttpOnly cookie for refresh token
  setRefreshTokenCookie(res, result.rawRefreshToken);

  // Response body contains ONLY access token and user metadata — NEVER the refresh token
  res.status(201).json(
    ApiResponse.success(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "User registered successfully"
    )
  );
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  // Set HttpOnly cookie for refresh token
  setRefreshTokenCookie(res, result.rawRefreshToken);

  // Response body contains ONLY access token and user metadata — NEVER the refresh token
  res.status(200).json(
    ApiResponse.success(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Login successful"
    )
  );
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.refreshToken;
  const result = await authService.refresh(rawToken);

  // Rotate cookie with new refresh token
  setRefreshTokenCookie(res, result.newRefreshToken);

  res.status(200).json(
    ApiResponse.success(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Token refreshed successfully"
    )
  );
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.refreshToken;
  await authService.logout(rawToken);

  clearRefreshTokenCookie(res);

  res.status(200).json(ApiResponse.success(null, "Logged out successfully"));
});

export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  res.status(200).json(ApiResponse.success(user));
});

export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const role = req.query.role as Role | undefined;
  const users = await authService.listUsers(role);
  res.status(200).json(ApiResponse.success(users));
});
