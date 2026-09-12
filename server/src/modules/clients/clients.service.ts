import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { CreateClientInput, UpdateClientInput } from "./clients.validation.js";

export class ClientsService {
  async create(input: CreateClientInput) {
    return prisma.client.create({
      data: {
        name: input.name,
        email: input.email || null,
        company: input.company || null,
      },
    });
  }

  async list() {
    return prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  }

  async getById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      throw ApiError.notFound("Client not found", "CLIENT_NOT_FOUND");
    }

    return client;
  }

  async update(id: string, input: UpdateClientInput) {
    await this.getById(id);

    return prisma.client.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string, cascade: boolean = false) {
    await this.getById(id);

    const projectCount = await prisma.project.count({
      where: { clientId: id },
    });

    if (projectCount > 0 && !cascade) {
      throw ApiError.badRequest(
        `Cannot delete client: linked to ${projectCount} active project(s). Use cascade delete or reassign/delete projects first.`,
        "CLIENT_HAS_PROJECTS"
      );
    }

    if (projectCount > 0 && cascade) {
      await prisma.$transaction(async (tx) => {
        const projects = await tx.project.findMany({
          where: { clientId: id },
          select: { id: true },
        });
        const projectIds = projects.map((p) => p.id);

        if (projectIds.length > 0) {
          await tx.taskActivityLog.deleteMany({
            where: { projectId: { in: projectIds } },
          });

          await tx.notification.deleteMany({
            where: {
              relatedTask: {
                projectId: { in: projectIds },
              },
            },
          });

          await tx.task.deleteMany({
            where: { projectId: { in: projectIds } },
          });

          await tx.project.deleteMany({
            where: { id: { in: projectIds } },
          });
        }

        await tx.client.delete({ where: { id } });
      });

      return { deleted: true, cascadedProjects: projectCount };
    }

    await prisma.client.delete({ where: { id } });
    return { deleted: true };
  }
}

export const clientsService = new ClientsService();
