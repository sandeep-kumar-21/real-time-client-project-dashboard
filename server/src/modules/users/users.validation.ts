import { z } from "zod";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role, {
    message: "Role must be ADMIN, PROJECT_MANAGER, or DEVELOPER",
  }),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Valid email address is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z
    .nativeEnum(Role, {
      message: "Role must be ADMIN, PROJECT_MANAGER, or DEVELOPER",
    })
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

