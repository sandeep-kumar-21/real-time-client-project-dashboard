import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { AuthenticatedUser } from "../../@types/express.js";
import { CreateProjectInput, UpdateProjectInput } from "./projects.validation.js";

export class ProjectsService {
  async create(input: CreateProjectInput, user: AuthenticatedUser) {
    if (user.role === Role.DEVELOPER) {
      throw ApiError.forbidden("Developers cannot create projects", "DEVELOPER_CANNOT_CREATE_PROJECT");
    }

    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) {
      throw ApiError.notFound("Client not found", "CLIENT_NOT_FOUND");
    }

    return prisma.project.create({
      data: {
        name: input.name,
        description: input.description || null,
        clientId: input.clientId,
        createdById: user.id,
      },
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async list(user: AuthenticatedUser) {
    let whereClause: any = {};

    if (user.role === Role.PROJECT_MANAGER) {
      // Assessment Requirement: PM sees only projects they created
      whereClause = { createdById: user.id };
    } else if (user.role === Role.DEVELOPER) {
      // Assessment Requirement: Developer sees projects where they have assigned tasks
      whereClause = {
        tasks: {
          some: {
            assignedToId: user.id,
          },
        },
      };
    }
    // Admin sees all projects (whereClause = {})

    return prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async getById(id: string, user: AuthenticatedUser) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        },
      },
    });

    if (!project) {
      throw ApiError.notFound("Project not found", "PROJECT_NOT_FOUND");
    }

    // Role-based access & ownership checks
    if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You can only view projects you created",
        "PROJECT_ACCESS_DENIED"
      );
    }

    if (user.role === Role.DEVELOPER) {
      // Check if developer has any assigned tasks in this project
      const hasAssignedTask = project.tasks.some((t) => t.assignedToId === user.id);
      if (!hasAssignedTask) {
        throw ApiError.forbidden(
          "Access denied: You do not have any tasks assigned in this project",
          "PROJECT_ACCESS_DENIED"
        );
      }

      // Assessment: "cannot see other developers' tasks"
      project.tasks = project.tasks.filter((t) => t.assignedToId === user.id);
    }

    return project;
  }

  async update(id: string, input: UpdateProjectInput, user: AuthenticatedUser) {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw ApiError.notFound("Project not found", "PROJECT_NOT_FOUND");
    }

    // Defense-in-depth: PM can only modify projects they created
    if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You cannot edit another Project Manager's project",
        "PROJECT_OWNERSHIP_REQUIRED"
      );
    }

    if (user.role === Role.DEVELOPER) {
      throw ApiError.forbidden(
        "Access denied: Developers cannot edit projects",
        "DEVELOPER_PROJECT_FORBIDDEN"
      );
    }

    return prisma.project.update({
      where: { id },
      data: input,
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async delete(id: string, user: AuthenticatedUser) {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw ApiError.notFound("Project not found", "PROJECT_NOT_FOUND");
    }

    if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You cannot delete another Project Manager's project",
        "PROJECT_OWNERSHIP_REQUIRED"
      );
    }

    if (user.role === Role.DEVELOPER) {
      throw ApiError.forbidden(
        "Access denied: Developers cannot delete projects",
        "DEVELOPER_PROJECT_FORBIDDEN"
      );
    }

    // Cascade delete handles tasks, activity logs automatically
    await prisma.project.delete({ where: { id } });
    return { deleted: true };
  }
}

export const projectsService = new ProjectsService();
