import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis.js";

export const OVERDUE_QUEUE_NAME = "overdue-task-scheduler";

export const overdueQueue = new Queue(OVERDUE_QUEUE_NAME, {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const initOverdueScheduler = async (everyMs: number = 60000): Promise<void> => {
  await overdueQueue.upsertJobScheduler(
    "scan-overdue-tasks-scheduler",
    { every: everyMs },
    {
      name: "scan-overdue-tasks",
      data: {},
    }
  );

  console.log(`[BullMQ] Overdue task scheduler registered (interval: ${everyMs / 1000}s)`);
};
