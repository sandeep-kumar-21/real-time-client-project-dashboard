import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { Role, NotificationType } from "@prisma/client";

describe("Phase 6: Notifications System", () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let notif1Id: string;
  let notif2Id: string;

  beforeAll(async () => {
    const u1 = await request(app).post("/api/auth/register").send({
      name: "Notif User 1",
      email: `notif1_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.DEVELOPER,
    });
    user1Token = u1.body.data.accessToken;
    user1Id = u1.body.data.user.id;

    const u2 = await request(app).post("/api/auth/register").send({
      name: "Notif User 2",
      email: `notif2_${Date.now()}@example.com`,
      password: "Password123!",
      role: Role.DEVELOPER,
    });
    user2Token = u2.body.data.accessToken;
    user2Id = u2.body.data.user.id;

    // Create 2 notifications for User 1
    const n1 = await prisma.notification.create({
      data: {
        userId: user1Id,
        type: NotificationType.TASK_ASSIGNED,
        message: "You have been assigned to task A",
        isRead: false,
      },
    });
    notif1Id = n1.id;

    const n2 = await prisma.notification.create({
      data: {
        userId: user1Id,
        type: NotificationType.TASK_ASSIGNED,
        message: "You have been assigned to task B",
        isRead: false,
      },
    });
    notif2Id = n2.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
    await prisma.$disconnect();
  });

  it("should get initial unread count of 2 for User 1", async () => {
    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBe(2);
  });

  it("should mark a single notification as read and decrement unread count", async () => {
    const patchRes = await request(app)
      .patch(`/api/notifications/${notif1Id}/read`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.isRead).toBe(true);

    const countRes = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(countRes.body.data.unreadCount).toBe(1);
  });

  it("User 2 CANNOT mark User 1's notification as read (403 Forbidden)", async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notif2Id}/read`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("NOTIFICATION_ACCESS_DENIED");
  });

  it("should mark all notifications as read in bulk", async () => {
    const patchRes = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(patchRes.status).toBe(200);

    const countRes = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(countRes.body.data.unreadCount).toBe(0);
  });
});
