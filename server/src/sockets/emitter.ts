import { Server } from "socket.io";
import { projectRoom, userRoom, ADMIN_GLOBAL_ROOM } from "./rooms.js";

let io: Server | null = null;

export const setSocketServer = (instance: Server): void => {
  io = instance;
};

export const getSocketServer = (): Server | null => {
  return io;
};

export const emitActivity = (projectId: string, activityLog: any): void => {
  if (!io) return;
  // Send to all clients currently viewing this project
  io.to(projectRoom(projectId)).emit("activity:new", activityLog);
  // Send to admin global feed
  io.to(ADMIN_GLOBAL_ROOM).emit("activity:new", activityLog);

  // Deliver to PM's room so PM receives real-time feed updates for their projects
  const projectOwnerId = activityLog.project?.createdById;
  if (projectOwnerId) {
    io.to(userRoom(projectOwnerId)).emit("activity:new", activityLog);
  }

  // Deliver to assigned Developer's room (developer sees activity only on tasks assigned to them)
  const assignedToId = activityLog.task?.assignedToId;
  if (assignedToId) {
    io.to(userRoom(assignedToId)).emit("activity:new", activityLog);
  }
};

export const emitTaskUpdated = (projectId: string, task: any): void => {
  if (!io) return;
  io.to(projectRoom(projectId)).emit("task:updated", task);
  io.to(ADMIN_GLOBAL_ROOM).emit("task:updated", task);

  const projectOwnerId = task.project?.createdById;
  if (projectOwnerId) {
    io.to(userRoom(projectOwnerId)).emit("task:updated", task);
  }

  const assignedToId = task.assignedToId || task.assignedTo?.id;
  if (assignedToId) {
    io.to(userRoom(assignedToId)).emit("task:updated", task);
  }
};

export const emitNotification = (userId: string, notification: any): void => {
  if (!io) return;
  io.to(userRoom(userId)).emit("notification:new", notification);
};

export const emitPresenceCount = (count: number, onlineUserIds?: string[]): void => {
  if (!io) return;
  io.to(ADMIN_GLOBAL_ROOM).emit("presence:update", {
    count,
    onlineUserIds: onlineUserIds || [],
  });
};
