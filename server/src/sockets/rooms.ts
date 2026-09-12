export const ADMIN_GLOBAL_ROOM = "global:admin";

export const projectRoom = (projectId: string): string => `project:${projectId}`;

export const userRoom = (userId: string): string => `user:${userId}`;
