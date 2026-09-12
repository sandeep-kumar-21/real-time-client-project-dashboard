import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export class NotificationsService {
  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        relatedTask: {
          select: { id: true, title: true, status: true, priority: true, projectId: true },
        },
      },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw ApiError.notFound("Notification not found", "NOTIFICATION_NOT_FOUND");
    }

    if (notification.userId !== userId) {
      throw ApiError.forbidden("Access denied to this notification", "NOTIFICATION_ACCESS_DENIED");
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { markedAllRead: true };
  }
}

export const notificationsService = new NotificationsService();
