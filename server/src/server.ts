import http from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";

const server = http.createServer(app);

import { initOverdueScheduler } from "./jobs/queues/overdueQueue.js";
import { createOverdueWorker } from "./jobs/workers/overdueWorker.js";
import { initSocketServer } from "./sockets/index.js";

// Initialize Socket.io attached to HTTP server
export const io = initSocketServer(server);

server.listen(env.PORT, async () => {
  console.log(`[Server] Velozity Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`[Server] Health check: http://localhost:${env.PORT}/health`);

  // Start background job scheduler if not in test mode
  if (env.NODE_ENV !== "test") {
    try {
      const { prisma } = await import("./config/prisma.js");
      await prisma.user.updateMany({ data: { isOnline: false } });
    } catch (err: any) {
      console.warn("[Server] Could not reset isOnline states on boot:", err.message);
    }

    try {
      await initOverdueScheduler(60000);
      createOverdueWorker();
    } catch (err: any) {
      console.error("[Server] Failed to initialize overdue job scheduler:", err.message);
    }
  }
});

const handleShutdown = (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
