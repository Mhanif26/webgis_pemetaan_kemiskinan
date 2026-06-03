import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware";
import {
  findAllUsers,
  createUser,
  updateUser,
  deleteUser,
  findUserByLoginIdentifier,
} from "./queries/users";
import { hashPassword } from "./auth";
import { createActivityLog } from "./queries/activityLogs";

async function logActivitySafe(payload: Parameters<typeof createActivityLog>[0]) {
  try {
    await createActivityLog(payload);
  } catch (error) {
    console.warn("[activity] failed to write user activity", error);
  }
}

export const userRouter = createRouter({
  list: adminQuery.query(async () => {
    return findAllUsers();
  }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["admin", "officer", "manager"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await findUserByLoginIdentifier(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email sudah terdaftar di sistem.",
        });
      }

      const result = await createUser({
        unionId: input.email,
        name: input.name,
        email: input.email,
        passwordHash: hashPassword(input.password),
        role: input.role,
        lastSignInAt: new Date(),
      });

      const insertedId = result.insertId;

      await logActivitySafe({
        userId: ctx.user.id,
        action: "CREATE",
        entityType: "user",
        entityId: insertedId,
        details: `Membuat akun baru: ${input.name} (${input.role})`,
      });

      return { success: true, id: insertedId };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        role: z.enum(["admin", "officer", "manager"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updatedFields: Record<string, any> = {};

      if (input.name !== undefined) updatedFields.name = input.name;
      if (input.email !== undefined) {
        const existing = await findUserByLoginIdentifier(input.email);
        if (existing && existing.id !== input.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email sudah terdaftar untuk pengguna lain.",
          });
        }
        updatedFields.email = input.email;
        updatedFields.unionId = input.email;
      }
      if (input.password !== undefined) {
        updatedFields.passwordHash = hashPassword(input.password);
      }
      if (input.role !== undefined) updatedFields.role = input.role;

      await updateUser(input.id, updatedFields);

      await logActivitySafe({
        userId: ctx.user.id,
        action: "UPDATE",
        entityType: "user",
        entityId: input.id,
        details: `Memperbarui akun pengguna ID ${input.id}`,
      });

      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Anda tidak dapat menghapus akun Anda sendiri.",
        });
      }

      await deleteUser(input.id);

      await logActivitySafe({
        userId: ctx.user.id,
        action: "DELETE",
        entityType: "user",
        entityId: input.id,
        details: `Menghapus akun pengguna ID ${input.id}`,
      });

      return { success: true };
    }),
});
