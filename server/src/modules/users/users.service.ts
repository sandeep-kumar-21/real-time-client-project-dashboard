import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { CreateUserInput, UpdateUserInput } from "./users.validation.js";
import { presenceTracker } from "../../sockets/presence.js";

export class UsersService {
  async listUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
        createdAt: true,
        _count: {
          select: {
            projectsCreated: true,
            assignedTasks: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isOnline: presenceTracker.isUserOnline(u.id) || u.isOnline,
      createdAt: u.createdAt,
      projectsCount: u._count.projectsCreated,
      tasksCount: u._count.assignedTasks,
    }));
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
        createdAt: true,
        _count: {
          select: {
            projectsCreated: true,
            assignedTasks: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnline: presenceTracker.isUserOnline(user.id) || user.isOnline,
      createdAt: user.createdAt,
      projectsCount: user._count.projectsCreated,
      tasksCount: user._count.assignedTasks,
    };
  }

  async createUser(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw ApiError.conflict("A user with this email already exists", "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
        createdAt: true,
      },
    });

    return user;
  }

  async updateUser(id: string, input: UpdateUserInput) {
    await this.getById(id);

    if (input.email) {
      const existing = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (existing && existing.id !== id) {
        throw ApiError.conflict("A user with this email already exists", "EMAIL_EXISTS");
      }
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email.toLowerCase();
    if (input.role !== undefined) data.role = input.role;
    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async deleteUser(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw ApiError.badRequest(
        "Administrators cannot delete their own account",
        "SELF_DELETION_FORBIDDEN"
      );
    }

    await this.getById(id);

    // Check if user owns projects
    const projectsCount = await prisma.project.count({
      where: { createdById: id },
    });
    if (projectsCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete user who owns ${projectsCount} project(s). Reassign or delete their projects first.`,
        "USER_OWNS_PROJECTS"
      );
    }

    // Atomic deletion of dependent records
    await prisma.$transaction(async (tx) => {
      // Unassign tasks assigned to this user
      await tx.task.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null },
      });

      // Delete notifications and refresh tokens
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await tx.taskActivityLog.deleteMany({ where: { userId: id } });

      // Delete user
      await tx.user.delete({ where: { id } });
    });

    return { deleted: true };
  }
}

export const usersService = new UsersService();

