import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "./auth.utils.js";
import { LoginInput, RegisterInput } from "./auth.validation.js";

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw ApiError.conflict("A user with this email already exists", "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return { user, accessToken, rawRefreshToken };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      rawRefreshToken,
    };
  }

  async refresh(rawToken: string) {
    if (!rawToken) {
      throw ApiError.unauthorized("Refresh token is required", "MISSING_REFRESH_TOKEN");
    }

    const tokenHash = hashToken(rawToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw ApiError.unauthorized("Invalid refresh token", "INVALID_REFRESH_TOKEN");
    }

    // Token reuse detection: if a revoked token is presented, compromise is suspected
    if (storedToken.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true },
      });
      throw ApiError.unauthorized(
        "Compromised session detected. Please log in again.",
        "TOKEN_REUSE_DETECTED"
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw ApiError.unauthorized("Refresh token has expired", "EXPIRED_REFRESH_TOKEN");
    }

    // Rotate refresh token atomically in transaction
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: storedToken.userId,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    const newAccessToken = generateAccessToken(storedToken.user);

    return {
      accessToken: newAccessToken,
      newRefreshToken: newRawRefreshToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
    };
  }

  async logout(rawToken?: string) {
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }
    return { loggedOut: true };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }

    return user;
  }

  async listUsers(role?: Role) {
    return prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });
  }
}

export const authService = new AuthService();
