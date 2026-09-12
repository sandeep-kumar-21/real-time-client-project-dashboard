import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { Role, TaskStatus, TaskPriority } from "@prisma/client";

describe("Phase 5: Real-Time Activity Feed & Role-Scoped Catchup", () => {
  let adminToken: string;
  let pm1Token: string;
  let pm2Token: string;
  let dev1Token: string;
  let dev2Token: string;

  let pm1Id: string;
  let dev1Id: string;
  let dev2Id: string;

  let proj1Id: string;
  let proj2Id: string;

  beforeAll(async () => {
    // Setup users
    const adminRes = await request(app).post("/api/auth/register").send({
      name: "Act Admin",
      email: `act_admin_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.ADMIN,
    });
    adminToken = adminRes.body.data.accessToken;

    const pm1Res = await request(app).post("/api/auth/register").send({
      name: "Act PM1",
      email: `act_pm1_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.PROJECT_MANAGER,
    });
    pm1Token = pm1Res.body.data.accessToken;
    pm1Id = pm1Res.body.data.user.id;

    const pm2Res = await request(app).post("/api/auth/register").send({
      name: "Act PM2",
      email: `act_pm2_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.PROJECT_MANAGER,
    });
    pm2Token = pm2Res.body.data.accessToken;

    const dev1Res = await request(app).post("/api/auth/register").send({
      name: "Act Dev1",
      email: `act_dev1_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.DEVELOPER,
    });
    dev1Token = dev1Res.body.data.accessToken;
    dev1Id = dev1Res.body.data.user.id;

    const dev2Res = await request(app).post("/api/auth/register").send({
      name: "Act Dev2",
      email: `act_dev2_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.DEVELOPER,
    });
    dev2Token = dev2Res.body.data.accessToken;
    dev2Id = dev2Res.body.data.user.id;

    // Create client
    const client = await prisma.client.create({
      data: { name: "Activity Client" },
    });

    // PM1 creates Project 1
    const p1 = await prisma.project.create({
      data: { name: "Project 1", clientId: client.id, createdById: pm1Id },
    });
    proj1Id = p1.id;

    // PM2 creates Project 2
    const p2 = await prisma.project.create({
      data: { name: "Project 2", clientId: client.id, createdById: pm2Res.body.data.user.id },
    });
    proj2Id = p2.id;

    // PM1 creates Task 1 assigned to Dev1
    const t1 = await prisma.task.create({
      data: {
        title: "Dev1 Task in Proj1",
        projectId: proj1Id,
        assignedToId: dev1Id,
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
      },
    });

    // PM1 creates Task 2 assigned to Dev2
    const t2 = await prisma.task.create({
      data: {
        title: "Dev2 Task in Proj1",
        projectId: proj1Id,
        assignedToId: dev2Id,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      },
    });

    // Create historical activity logs for both
    await prisma.taskActivityLog.createMany({
      data: [
        {
          taskId: t1.id,
          projectId: proj1Id,
          userId: dev1Id,
          fromStatus: TaskStatus.TODO,
          toStatus: TaskStatus.IN_PROGRESS,
          message: "Act Dev1 moved Task Dev1 Task in Proj1 from To Do → In Progress",
        },
        {
          taskId: t2.id,
          projectId: proj1Id,
          userId: dev2Id,
          fromStatus: TaskStatus.TODO,
          toStatus: TaskStatus.IN_PROGRESS,
          message: "Act Dev2 moved Task Dev2 Task in Proj1 from To Do → In Progress",
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.taskActivityLog.deleteMany({ where: { projectId: proj1Id } });
    await prisma.task.deleteMany({ where: { projectId: proj1Id } });
    await prisma.project.deleteMany({ where: { id: { in: [proj1Id, proj2Id] } } });
    await prisma.client.deleteMany({ where: { name: "Activity Client" } });
    await prisma.refreshToken.deleteMany({ where: { user: { email: { contains: "act_" } } } });
    await prisma.user.deleteMany({ where: { email: { contains: "act_" } } });
    await prisma.$disconnect();
  });

  describe("GET /api/activity/feed (Role-Filtered Catch-up from Postgres)", () => {
    it("Admin sees activity across all projects in global feed", async () => {
      const res = await request(app)
        .get("/api/activity/feed")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("PM-1 sees activity from their own projects only", async () => {
      const res = await request(app)
        .get("/api/activity/feed")
        .set("Authorization", `Bearer ${pm1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // All items must belong to PM1's projects
      const allMine = res.body.data.every((item: any) => item.projectId === proj1Id);
      expect(allMine).toBe(true);
    });

    it("PM-2 sees zero activity from PM-1's projects", async () => {
      const res = await request(app)
        .get("/api/activity/feed")
        .set("Authorization", `Bearer ${pm2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const anyMine = res.body.data.some((item: any) => item.projectId === proj1Id);
      expect(anyMine).toBe(false);
    });

    it("Developer-1 sees activity ONLY for tasks assigned to Developer-1", async () => {
      const res = await request(app)
        .get("/api/activity/feed")
        .set("Authorization", `Bearer ${dev1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Must only contain Dev1's task activity
      const hasDev1 = res.body.data.some((item: any) => item.message.includes("Dev1 Task"));
      const hasDev2 = res.body.data.some((item: any) => item.message.includes("Dev2 Task"));
      expect(hasDev1).toBe(true);
      expect(hasDev2).toBe(false);
    });

    it("Respects limit query parameter for missed event pagination", async () => {
      const res = await request(app)
        .get("/api/activity/feed?limit=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].message).toBeDefined();
      expect(res.body.data[0].createdAt).toBeDefined();
    });
  });
});
