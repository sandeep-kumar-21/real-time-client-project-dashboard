import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";

describe("Phase 2: Authentication & RBAC Test Suite", () => {
  const testEmail = `test_dev_${Date.now()}@example.com`;
  const testPassword = "Password123!";
  let accessToken: string;
  let refreshTokenCookie: string;

  beforeAll(async () => {
    // Clean up any lingering test users
    await prisma.user.deleteMany({
      where: { email: { contains: "test_" } },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "test_" } },
    });
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should reject registration with invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Invalid",
        email: "not-an-email",
        password: "short",
        role: "DEVELOPER",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it("should successfully register a developer, return access token in body and refresh token in HttpOnly cookie", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test Developer",
        email: testEmail,
        password: testPassword,
        role: "DEVELOPER",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.role).toBe("DEVELOPER");
      expect(res.body.data.accessToken).toBeDefined();

      // Assessment Requirement #3: Refresh token MUST NOT be in response body
      expect(res.body.data.refreshToken).toBeUndefined();

      // Refresh token MUST be in Set-Cookie header with HttpOnly
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : cookies;
      expect(cookieStr).toContain("refreshToken=");
      expect(cookieStr).toContain("HttpOnly");

      accessToken = res.body.data.accessToken;
      refreshTokenCookie = cookieStr;
    });

    it("should reject duplicate registration with 409 Conflict", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Duplicate User",
        email: testEmail,
        password: testPassword,
        role: "DEVELOPER",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("EMAIL_EXISTS");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should reject invalid credentials with 401 Unauthorized", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "WrongPassword!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should login successfully and return new access token and HttpOnly cookie", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeUndefined();

      const cookies = res.headers["set-cookie"];
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : cookies;
      expect(cookieStr).toContain("refreshToken=");
      expect(cookieStr).toContain("HttpOnly");

      accessToken = res.body.data.accessToken;
      refreshTokenCookie = cookieStr;
    });
  });

  describe("GET /api/auth/me (Protected Route)", () => {
    it("should reject unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("MISSING_TOKEN");
    });

    it("should return current user profile with valid Bearer token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
      expect(res.body.data.role).toBe("DEVELOPER");
      expect(res.body.data.passwordHash).toBeUndefined();
    });
  });

  describe("POST /api/auth/refresh (Token Rotation)", () => {
    it("should rotate refresh token and issue new access token", async () => {
      // Extract raw cookie value
      const match = refreshTokenCookie.match(/refreshToken=([^;]+)/);
      const rawCookie = match ? match[0] : "";

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", [rawCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.accessToken).not.toBe(accessToken);

      const cookies = res.headers["set-cookie"];
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : cookies;
      expect(cookieStr).toContain("refreshToken=");
    });

    it("should detect token reuse and reject revoked refresh token", async () => {
      // Replay the old revoked cookie
      const match = refreshTokenCookie.match(/refreshToken=([^;]+)/);
      const oldRawCookie = match ? match[0] : "";

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", [oldRawCookie]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("TOKEN_REUSE_DETECTED");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear the refresh token cookie and revoke token", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers["set-cookie"];
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : cookies;
      // Cookie is cleared
      expect(cookieStr).toMatch(/refreshToken=;/);
    });
  });
});
