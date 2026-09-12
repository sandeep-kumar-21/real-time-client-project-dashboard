import { Redis } from "ioredis";
import { env } from "./env.js";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redisConnection.on("connect", () => {
  console.log("[Redis] Connected to Redis on " + env.REDIS_URL);
});

redisConnection.on("error", (err) => {
  console.error("[Redis] Connection Error:", err.message);
});
