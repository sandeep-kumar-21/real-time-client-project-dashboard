import http from "http";
import { Server, Socket } from "socket.io";
import { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";
import { AuthenticatedUser } from "../@types/express.js";
import { ADMIN_GLOBAL_ROOM, projectRoom, userRoom } from "./rooms.js";
import { presenceTracker } from "./presence.js";
import { setSocketServer, emitPresenceCount } from "./emitter.js";

interface AuthenticatedSocket extends Socket {
  data: {
    user: AuthenticatedUser;
  };
}

export const initSocketServer = (httpServer: http.Server): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          env.CLIENT_ORIGIN,
          "http://localhost:5173",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
        ];
        if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
          return callback(null, true);
        }
        return callback(new Error("CORS policy violation: socket origin not allowed"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Handshake Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token required for WebSocket connection"));
      }

      const user = verifyAccessToken(token);
      socket.data.user = user;
      next();
    } catch (err: any) {
      console.warn("[WebSocket] Unauthorized socket connection attempt:", err.message);
      next(new Error("Authentication failed: invalid or expired token"));
    }
  });

  io.on("connection", async (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const user = socket.data.user;

    console.log(`[WebSocket] Connected: ${user.email} (${user.role}) [socket: ${socket.id}]`);

    // 1. Join user's personal private room for direct notifications
    socket.join(userRoom(user.id));

    // 2. If Admin, join global admin room
    if (user.role === Role.ADMIN) {
      socket.join(ADMIN_GLOBAL_ROOM);
    }

    // 3. Track Presence (distinct active users)
    const onlineCount = presenceTracker.userConnected(user.id, socket.id);
    await prisma.user
      .updateMany({
        where: { id: user.id },
        data: { isOnline: true },
      })
      .catch((err: any) => console.error("[WebSocket] Failed to set isOnline:", err.message));

    const onlineUserIds = presenceTracker.getOnlineUserIds();
    emitPresenceCount(onlineCount, onlineUserIds);
    io.to(ADMIN_GLOBAL_ROOM).emit("presence:user", {
      userId: user.id,
      isOnline: true,
      count: onlineCount,
      onlineUserIds,
    });

    // 4. Room Subscription: join project room
    socket.on("join:project", async (projectId: string) => {
      if (!projectId || typeof projectId !== "string") return;

      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            tasks: { select: { assignedToId: true } },
          },
        });

        if (!project) return;

        // Check permission
        const isPermitted =
          user.role === Role.ADMIN ||
          (user.role === Role.PROJECT_MANAGER && project.createdById === user.id) ||
          (user.role === Role.DEVELOPER &&
            project.tasks.some((t) => t.assignedToId === user.id));

        if (isPermitted) {
          socket.join(projectRoom(projectId));
          console.log(`[WebSocket] ${user.email} joined ${projectRoom(projectId)}`);
        } else {
          console.warn(`[WebSocket] ${user.email} denied access to ${projectRoom(projectId)}`);
        }
      } catch (err: any) {
        console.error("Error joining project room:", err.message);
      }
    });

    // 5. Room Subscription: leave project room
    socket.on("leave:project", (projectId: string) => {
      if (projectId && typeof projectId === "string") {
        socket.leave(projectRoom(projectId));
        console.log(`[WebSocket] ${user.email} left ${projectRoom(projectId)}`);
      }
    });

    // 6. Disconnect handler
    socket.on("disconnect", async () => {
      console.log(`[WebSocket] Disconnected: ${user.email} [socket: ${socket.id}]`);
      const updatedCount = presenceTracker.userDisconnected(user.id, socket.id);
      const isStillOnline = presenceTracker.isUserOnline(user.id);
      if (!isStillOnline) {
        await prisma.user
          .updateMany({
            where: { id: user.id },
            data: { isOnline: false },
          })
          .catch((err: any) => console.error("[WebSocket] Failed to reset isOnline:", err.message));
      }
      const remainingUserIds = presenceTracker.getOnlineUserIds();
      emitPresenceCount(updatedCount, remainingUserIds);
      io.to(ADMIN_GLOBAL_ROOM).emit("presence:user", {
        userId: user.id,
        isOnline: isStillOnline,
        count: updatedCount,
        onlineUserIds: remainingUserIds,
      });
    });
  });

  setSocketServer(io);
  return io;
};
