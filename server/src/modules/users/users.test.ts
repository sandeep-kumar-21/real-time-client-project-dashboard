import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { Role } from "@prisma/client";

describe("Admin User Management & RBAC Test Suite", () => {
  let adminToken: string;
  let adminId: string;
  let pmToken: string;
  let devToken: string;
  let createdUserId: string;

  const runId = Date.now();
  const testDomain = `@usertest${runId}.com`;

  beforeAll(async () => {
    // Register test admin
    const adminRes = await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: `admin${testDomain}`,
      password: "Password123!",
      role: Role.ADMIN,
    });
    adminToken = adminRes.body.data.accessToken;
    adminId = adminRes.body.data.user.id;

    // Register test PM
    const pmRes = await request(app).post("/api/auth/register").send({
      name: "PM User",
      email: `pm${testDomain}`,
      password: "Password123!",
      role: Role.PROJECT_MANAGER,
    });
    pmToken = pmRes.body.data.accessToken;

    // Register test Developer
    const devRes = await request(app).post("/api/auth/register").send({
      name: "Dev User",
      email: `dev${testDomain}`,
      password: "Password123!",
      role: Role.DEVELOPER,
    });
    devToken = devRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { endsWith: testDomain } } },
    });
    await prisma.notification.deleteMany({
      where: { user: { email: { endsWith: testDomain } } },
    });
    await prisma.user.deleteMany({
      where: { email: { endsWith: testDomain } },
    });
    await prisma.$disconnect();
  });

  describe("Access Control (RBAC)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject DEVELOPER access to user management with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${devToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INSUFFICIENT_ROLE_PERMISSIONS");
    });

    it("should reject PROJECT_MANAGER access to user management with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${pmToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INSUFFICIENT_ROLE_PERMISSIONS");
    });

    it("should allow ADMIN to list users with 200 OK", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("User Creation (POST /api/users)", () => {
    it("should reject creation with invalid role", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Invalid Role User",
          email: `invalid_role${testDomain}`,
          password: "Password123!",
          role: "SUPERUSER",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should allow ADMIN to create a new DEVELOPER", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Karan Verma",
          email: `karan${testDomain}`,
          password: "Password123!",
          role: Role.DEVELOPER,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Karan Verma");
      expect(res.body.data.email).toBe(`karan${testDomain}`);
      expect(res.body.data.role).toBe("DEVELOPER");
      expect(res.body.data.passwordHash).toBeUndefined();

      createdUserId = res.body.data.id;
    });

    it("should reject duplicate email with 409 Conflict", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Duplicate User",
          email: `karan${testDomain}`,
          password: "Password123!",
          role: Role.DEVELOPER,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("EMAIL_EXISTS");
    });
  });

  describe("User Detail & Listing (GET /api/users / GET /api/users/:id)", () => {
    it("should return created user by ID", async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdUserId);
      expect(res.body.data.name).toBe("Karan Verma");
    });

    it("should return 404 for non-existent user ID", async () => {
      const res = await request(app)
        .get("/api/users/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });

    it("should include workload counts in user list", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const user = res.body.data.find((u: any) => u.id === createdUserId);
      expect(user).toBeDefined();
      expect(typeof user.tasksCount).toBe("number");
      expect(typeof user.projectsCount).toBe("number");
    });
  });

  describe("User Update (PUT /api/users/:id)", () => {
    it("should update user name and promote role to PROJECT_MANAGER", async () => {
      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Karan Verma (Lead)",
          role: Role.PROJECT_MANAGER,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Karan Verma (Lead)");
      expect(res.body.data.role).toBe("PROJECT_MANAGER");
    });
  });

  describe("User Deletion (DELETE /api/users/:id)", () => {
    it("should prevent admin from deleting their own account (SELF_DELETION_FORBIDDEN)", async () => {
      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("SELF_DELETION_FORBIDDEN");
    });

    it("should successfully delete the created user", async () => {
      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toBe(true);

      // Verify user is gone
      const verifyRes = await request(app)
        .get(`/api/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(verifyRes.status).toBe(404);
    });
  });
});
