import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { Role, TaskStatus, TaskPriority } from "@prisma/client";

describe("Phase 7: Role-Specific Dashboard Metrics", () => {
  let adminToken: string;
  let pmToken: string;
  let devToken: string;
  let pmId: string;
  let devId: string;

  beforeAll(async () => {
    // Register Admin
    const a = await request(app).post("/api/auth/register").send({
      name: "Dash Admin",
      email: `dash_admin_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.ADMIN,
    });
    adminToken = a.body.data.accessToken;

    // Register PM
    const p = await request(app).post("/api/auth/register").send({
      name: "Dash PM",
      email: `dash_pm_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.PROJECT_MANAGER,
    });
    pmToken = p.body.data.accessToken;
    pmId = p.body.data.user.id;

    // Register Dev
    const d = await request(app).post("/api/auth/register").send({
      name: "Dash Dev",
      email: `dash_dev_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.DEVELOPER,
    });
    devToken = d.body.data.accessToken;
    devId = d.body.data.user.id;

    // Setup client & project
    const client = await prisma.client.create({ data: { name: "Dash Client" } });
    const project = await prisma.project.create({
      data: { name: "Dash Project", clientId: client.id, createdById: pmId },
    });

    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Create tasks with different priorities and due dates
    await prisma.task.createMany({
      data: [
        {
          title: "Critical Task",
          projectId: project.id,
          assignedToId: devId,
          priority: TaskPriority.CRITICAL,
          status: TaskStatus.IN_PROGRESS,
          dueDate: inThreeDays,
        },
        {
          title: "Low Task",
          projectId: project.id,
          assignedToId: devId,
          priority: TaskPriority.LOW,
          status: TaskStatus.TODO,
          dueDate: inThreeDays,
        },
        {
          title: "Overdue Task",
          projectId: project.id,
          assignedToId: devId,
          priority: TaskPriority.HIGH,
          status: TaskStatus.TODO,
          isOverdue: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.taskActivityLog.deleteMany({
      where: { user: { email: { contains: "dash_" } } },
    });
    await prisma.task.deleteMany({
      where: { project: { client: { name: "Dash Client" } } },
    });
    await prisma.project.deleteMany({
      where: { client: { name: "Dash Client" } },
    });
    await prisma.client.deleteMany({
      where: { name: "Dash Client" },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: "dash_" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "dash_" } },
    });
    await prisma.$disconnect();
  });

  it("Admin receives total projects, tasks by status, overdue count, and active presence count", async () => {
    const res = await request(app)
      .get("/api/dashboard/metrics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("ADMIN");
    expect(res.body.data.totalProjects).toBeGreaterThanOrEqual(1);
    expect(res.body.data.overdueCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.tasksByStatus.IN_PROGRESS).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.data.activeUsersOnline).toBe("number");
  });

  it("PM receives their projects summary, tasks by priority, and upcoming due dates this week", async () => {
    const res = await request(app)
      .get("/api/dashboard/metrics")
      .set("Authorization", `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("PROJECT_MANAGER");
    expect(res.body.data.totalProjects).toBe(1);
    expect(res.body.data.tasksByPriority.CRITICAL).toBe(1);
    expect(res.body.data.tasksByPriority.LOW).toBe(1);
    expect(res.body.data.dueThisWeek.length).toBeGreaterThanOrEqual(1);
  });

  it("Developer receives assigned tasks strictly sorted by priority then due date", async () => {
    const res = await request(app)
      .get("/api/dashboard/metrics")
      .set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("DEVELOPER");
    expect(res.body.data.totalAssigned).toBe(3);

    // Assessment Requirement: "Developer dashboard: their assigned tasks, sorted by priority then due date"
    const assigned = res.body.data.assignedTasks;
    expect(assigned.length).toBe(3);
    expect(assigned[0].priority).toBe("CRITICAL");
    expect(assigned[1].priority).toBe("HIGH");
    expect(assigned[2].priority).toBe("LOW");
  });
});
