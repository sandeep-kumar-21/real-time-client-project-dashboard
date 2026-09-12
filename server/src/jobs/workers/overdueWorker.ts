import { Worker, Job } from "bullmq";
import { TaskStatus, NotificationType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { redisConnection } from "../../config/redis.js";
import { OVERDUE_QUEUE_NAME } from "../queues/overdueQueue.js";

// Core function decoupled for both worker processing and automated testing
export const processOverdueTasks = async () => {
  const now = new Date();

  // Query utilizes the (status, dueDate) composite index
  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: TaskStatus.DONE },
      isOverdue: false,
    },
    include: {
      project: { select: { id: true, createdById: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (overdueTasks.length === 0) {
    return { flaggedCount: 0 };
  }

  console.log(`[OverdueWorker] Found ${overdueTasks.length} overdue task(s). Auto-flagging...`);

  let flaggedCount = 0;

  for (const task of overdueTasks) {
    await prisma.$transaction(async (tx) => {
      // 1. Mark task as overdue
      await tx.task.update({
        where: { id: task.id },
        data: { isOverdue: true },
      });

      // 2. Insert Activity Log row (stored in DB, not derived)
      const activityMessage = `Task "${task.title}" was auto-flagged as Overdue by background scheduler`;

      await tx.taskActivityLog.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: task.project.createdById, // System actor attribute to project owner
          fromStatus: task.status,
          toStatus: task.status,
          message: activityMessage,
        },
      });

      // 3. Notify assigned developer if present
      if (task.assignedToId) {
        await tx.notification.create({
          data: {
            userId: task.assignedToId,
            type: NotificationType.TASK_ASSIGNED, // Or general alert
            message: `Task "${task.title}" is overdue`,
            relatedTaskId: task.id,
          },
        });
      }
    });

    flaggedCount++;
  }

  return { flaggedCount };
};

export const createOverdueWorker = (): Worker => {
  const worker = new Worker(
    OVERDUE_QUEUE_NAME,
    async (job: Job) => {
      console.log(`[BullMQ Job ${job.id}] Running scheduled overdue task scan...`);
      const result = await processOverdueTasks();
      return result;
    },
    {
      connection: redisConnection as any,
      concurrency: 1,
    }
  );

  worker.on("completed", (job, result) => {
    console.log(`[BullMQ Job ${job.id}] Overdue scan complete. Flagged: ${result?.flaggedCount}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[BullMQ Job ${job?.id}] Overdue scan failed:`, err.message);
  });

  return worker;
};
