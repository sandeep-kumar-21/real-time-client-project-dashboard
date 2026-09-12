import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../config/prisma.js";
import { processOverdueTasks } from "./workers/overdueWorker.js";
import { Role, TaskStatus, TaskPriority } from "@prisma/client";

describe("Phase 4: Background Job Overdue Task Scheduler", () => {
  let projectId: string;
  let overdueTask1Id: string;
  let doneTask2Id: string;
  let futureTask3Id: string;

  beforeAll(async () => {
    // Setup test user, client, project
    const user = await prisma.user.create({
      data: {
        name: "Scheduler Test User",
        email: `sched_test_${Date.now()}@example.com`,
        passwordHash: "hash123",
        role: Role.PROJECT_MANAGER,
      },
    });

    const client = await prisma.client.create({
      data: { name: "Scheduler Client", company: "Sched Inc" },
    });

    const project = await prisma.project.create({
      data: {
        name: "Scheduler Project",
        clientId: client.id,
        createdById: user.id,
      },
    });
    projectId = project.id;

    // Yesterday timestamp
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Tomorrow timestamp
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 1. Task past due date & TODO (Must be flagged overdue)
    const t1 = await prisma.task.create({
      data: {
        title: "Overdue Pending Task",
        projectId,
        dueDate: yesterday,
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        isOverdue: false,
      },
    });
    overdueTask1Id = t1.id;

    // 2. Task past due date but DONE (Must NOT be flagged overdue)
    const t2 = await prisma.task.create({
      data: {
        title: "Overdue Finished Task",
        projectId,
        dueDate: yesterday,
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        isOverdue: false,
      },
    });
    doneTask2Id = t2.id;

    // 3. Task due in future (Must NOT be flagged overdue)
    const t3 = await prisma.task.create({
      data: {
        title: "Future Pending Task",
        projectId,
        dueDate: tomorrow,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        isOverdue: false,
      },
    });
    futureTask3Id = t3.id;
  });

  afterAll(async () => {
    await prisma.taskActivityLog.deleteMany({ where: { projectId } });
    await prisma.task.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.client.deleteMany({ where: { name: "Scheduler Client" } });
    await prisma.user.deleteMany({ where: { email: { contains: "sched_test_" } } });
    await prisma.$disconnect();
  });

  it("should scan, detect past-due non-done tasks, flip isOverdue, and create activity logs in DB", async () => {
    const result = await processOverdueTasks();

    expect(result.flaggedCount).toBeGreaterThanOrEqual(1);

    // Verify task 1 is now marked overdue
    const updatedT1 = await prisma.task.findUnique({ where: { id: overdueTask1Id } });
    expect(updatedT1?.isOverdue).toBe(true);

    // Verify task 2 (DONE) was not marked overdue
    const updatedT2 = await prisma.task.findUnique({ where: { id: doneTask2Id } });
    expect(updatedT2?.isOverdue).toBe(false);

    // Verify task 3 (Future) was not marked overdue
    const updatedT3 = await prisma.task.findUnique({ where: { id: futureTask3Id } });
    expect(updatedT3?.isOverdue).toBe(false);

    // Verify Activity Log was written for Task 1
    const log = await prisma.taskActivityLog.findFirst({
      where: { taskId: overdueTask1Id },
      orderBy: { createdAt: "desc" },
    });
    expect(log).toBeDefined();
    expect(log?.message).toContain("auto-flagged as Overdue by background scheduler");
  });
});
