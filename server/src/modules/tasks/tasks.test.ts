import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { Role, TaskStatus, TaskPriority } from "@prisma/client";

describe("Phase 3: Core Resources & RBAC Ownership Enforcement", () => {
  let adminToken: string;
  let pm1Token: string;
  let pm2Token: string;
  let dev1Token: string;
  let dev2Token: string;

  let pm1Id: string;
  let dev1Id: string;
  let dev2Id: string;

  let clientId: string;
  let project1Id: string;
  let task1Id: string;
  let task2Id: string;

  const runId = Date.now();
  const clientName = `Task Client ${runId}`;

  beforeAll(async () => {
    // Register test users
    const adminRes = await request(app).post("/api/auth/register").send({
      name: "Super Admin",
      email: `admin_${runId}@tasktest.com`,
      password: "Password123!",
      role: Role.ADMIN,
    });
    adminToken = adminRes.body.data.accessToken;

    const pm1Res = await request(app).post("/api/auth/register").send({
      name: "PM Neha",
      email: `pm1_${runId}@tasktest.com`,
      password: "Password123!",
      role: Role.PROJECT_MANAGER,
    });
    pm1Token = pm1Res.body.data.accessToken;
    pm1Id = pm1Res.body.data.user.id;

    const pm2Res = await request(app).post("/api/auth/register").send({
      name: "PM Rohan",
      email: `pm2_${runId}@tasktest.com`,
      password: "Password123!",
      role: Role.PROJECT_MANAGER,
    });
    pm2Token = pm2Res.body.data.accessToken;

    const dev1Res = await request(app).post("/api/auth/register").send({
      name: "Dev Ravi",
      email: `dev1_${runId}@tasktest.com`,
      password: "Password123!",
      role: Role.DEVELOPER,
    });
    dev1Token = dev1Res.body.data.accessToken;
    dev1Id = dev1Res.body.data.user.id;

    const dev2Res = await request(app).post("/api/auth/register").send({
      name: "Dev Priya",
      email: `dev2_${runId}@tasktest.com`,
      password: "Password123!",
      role: Role.DEVELOPER,
    });
    dev2Token = dev2Res.body.data.accessToken;
    dev2Id = dev2Res.body.data.user.id;

    // Create client
    const clientRes = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: clientName,
        email: `contact_${runId}@tasktest.com`,
        company: "Task Industries",
      });
    clientId = clientRes.body.data.id;
  });

  afterAll(async () => {
    if (project1Id) {
      await prisma.taskActivityLog.deleteMany({ where: { projectId: project1Id } });
      await prisma.notification.deleteMany({
        where: { user: { email: { endsWith: "@tasktest.com" } } },
      });
      await prisma.task.deleteMany({ where: { projectId: project1Id } });
      await prisma.project.deleteMany({ where: { id: project1Id } });
    }
    if (clientId) {
      await prisma.client.deleteMany({ where: { id: clientId } });
    }
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { endsWith: "@tasktest.com" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { endsWith: "@tasktest.com" } },
    });
    await prisma.$disconnect();
  });

  describe("Project Management & Isolation", () => {
    it("PM-1 can create a project assigned to a client", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${pm1Token}`)
        .send({
          name: "Project One",
          description: "Internal PM1 Project",
          clientId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.createdById).toBe(pm1Id);
      project1Id = res.body.data.id;
    });

    it("Developer CANNOT create a project (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${dev1Token}`)
        .send({
          name: "Dev Project",
          clientId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("PM-2 CANNOT view or edit PM-1's project (Row-level PM isolation)", async () => {
      const getRes = await request(app)
        .get(`/api/projects/${project1Id}`)
        .set("Authorization", `Bearer ${pm2Token}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.error.code).toBe("PROJECT_ACCESS_DENIED");

      const updateRes = await request(app)
        .put(`/api/projects/${project1Id}`)
        .set("Authorization", `Bearer ${pm2Token}`)
        .send({ name: "Hacked Project" });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.error.code).toBe("PROJECT_OWNERSHIP_REQUIRED");
    });
  });

  describe("Task Assignment & Scoping", () => {
    it("PM-1 creates Task-1 assigned to Dev-1 and Task-2 assigned to Dev-2", async () => {
      const res1 = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${pm1Token}`)
        .send({
          title: "Build Authentication Flow",
          projectId: project1Id,
          assignedToId: dev1Id,
          priority: TaskPriority.HIGH,
        });

      expect(res1.status).toBe(201);
      task1Id = res1.body.data.id;

      const res2 = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${pm1Token}`)
        .send({
          title: "Design Database Schema",
          projectId: project1Id,
          assignedToId: dev2Id,
          priority: TaskPriority.CRITICAL,
        });

      expect(res2.status).toBe(201);
      task2Id = res2.body.data.id;
    });

    it("Assigning a task to an Admin or PM fails with 400 INVALID_ASSIGNEE_ROLE", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${pm1Token}`)
        .send({
          title: "Invalid Assignment Task",
          projectId: project1Id,
          assignedToId: pm1Id,
          priority: TaskPriority.LOW,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_ASSIGNEE_ROLE");
    });

    it("Updating task assignee to an Admin or PM fails with 400 INVALID_ASSIGNEE_ROLE", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task1Id}`)
        .set("Authorization", `Bearer ${pm1Token}`)
        .send({
          assignedToId: pm1Id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_ASSIGNEE_ROLE");
    });

    it("Creating a task with a past due date fails with 400 INVALID_DUE_DATE", async () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${pm1Token}`)
        .send({
          title: "Past Due Task",
          projectId: project1Id,
          assignedToId: dev1Id,
          priority: TaskPriority.LOW,
          dueDate: pastDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_DUE_DATE");
    });

    it("Dev-1 CANNOT view or update status on Task-2 assigned to Dev-2 (403 Forbidden)", async () => {
      const getRes = await request(app)
        .get(`/api/tasks/${task2Id}`)
        .set("Authorization", `Bearer ${dev1Token}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.error.code).toBe("TASK_ACCESS_DENIED");

      const patchRes = await request(app)
        .patch(`/api/tasks/${task2Id}/status`)
        .set("Authorization", `Bearer ${dev1Token}`)
        .send({ status: TaskStatus.IN_PROGRESS });

      expect(patchRes.status).toBe(403);
      expect(patchRes.body.error.code).toBe("TASK_UPDATE_FORBIDDEN");
    });

    it("Dev-1 updates Task-1 status from TODO to IN_PROGRESS, writing an Activity Log to DB", async () => {
      const patchRes = await request(app)
        .patch(`/api/tasks/${task1Id}/status`)
        .set("Authorization", `Bearer ${dev1Token}`)
        .send({ status: TaskStatus.IN_PROGRESS });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.task.status).toBe("IN_PROGRESS");

      // Verify activity log is written in DB
      const logs = await prisma.taskActivityLog.findMany({
        where: { taskId: task1Id, toStatus: TaskStatus.IN_PROGRESS },
      });
      expect(logs.length).toBe(1);
      expect(logs[0].fromStatus).toBe("TODO");
      expect(logs[0].toStatus).toBe("IN_PROGRESS");
      expect(logs[0].message).toContain("Dev Ravi");
      expect(logs[0].message).toContain("Build Authentication Flow");
    });

    it("Dev-1 moves Task-1 to IN_REVIEW, generating a notification for PM-1", async () => {
      const patchRes = await request(app)
        .patch(`/api/tasks/${task1Id}/status`)
        .set("Authorization", `Bearer ${dev1Token}`)
        .send({ status: TaskStatus.IN_REVIEW });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.task.status).toBe("IN_REVIEW");

      // Assessment Requirement #23: PM receives notification
      const notifications = await prisma.notification.findMany({
        where: { userId: pm1Id, type: "TASK_MOVED_TO_REVIEW" },
      });
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].message).toContain("Build Authentication Flow");
      expect(notifications[0].relatedTaskId).toBe(task1Id);
    });

    it("Admin reassigns Task-1 to Dev-2, writing an Activity Log to DB", async () => {
      const patchRes = await request(app)
        .patch(`/api/tasks/${task1Id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ assignedToId: dev2Id });

      expect(patchRes.status).toBe(200);

      // Verify activity log is written in DB
      const logs = await prisma.taskActivityLog.findMany({
        where: { taskId: task1Id, message: { contains: "Dev Priya" } },
      });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].message).toContain("Super Admin");
      expect(logs[0].message).toContain("reassigned task");
      expect(logs[0].message).toContain("Dev Priya");
    });

    it("URL query filters properly filter tasks by priority", async () => {
      const res = await request(app)
        .get(`/api/tasks?priority=${TaskPriority.CRITICAL}&projectId=${project1Id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("Design Database Schema");
    });
  });
});
