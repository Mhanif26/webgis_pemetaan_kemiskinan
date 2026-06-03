import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAllRecipients,
  findRecipientById,
  findPendingRecipients,
  createRecipient,
  updateRecipient,
  verifyRecipient,
  deleteRecipient,
} from "./queries/recipients";
import { createActivityLog } from "./queries/activityLogs";
import { findPlaceIdsByManagerId } from "./queries/placesOfWorship";
import { TRPCError } from "@trpc/server";

async function logActivitySafe(payload: Parameters<typeof createActivityLog>[0]) {
  try {
    await createActivityLog(payload);
  } catch (error) {
    console.warn("[activity] failed to write recipient activity", error);
  }
}

export const recipientRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        placeOfWorshipId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role === "manager") {
        const placeIds = await findPlaceIdsByManagerId(ctx.user.id);
        if (placeIds.length === 0) return [];
        if (input?.placeOfWorshipId) {
          if (!placeIds.includes(input.placeOfWorshipId)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Anda tidak berwenang mengakses data rumah ibadah ini.",
            });
          }
          return findAllRecipients(input?.search, input?.status, [input.placeOfWorshipId]);
        }
        return findAllRecipients(input?.search, input?.status, placeIds);
      }
      return findAllRecipients(
        input?.search,
        input?.status,
        input?.placeOfWorshipId ? [input.placeOfWorshipId] : undefined
      );
    }),

  pending: authedQuery
    .input(z.object({ placeOfWorshipId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user.role === "manager") {
        const placeIds = await findPlaceIdsByManagerId(ctx.user.id);
        if (placeIds.length === 0) return [];
        if (input?.placeOfWorshipId) {
          if (!placeIds.includes(input.placeOfWorshipId)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Anda tidak berwenang mengakses data rumah ibadah ini.",
            });
          }
          return findPendingRecipients([input.placeOfWorshipId]);
        }
        return findPendingRecipients(placeIds);
      }
      return findPendingRecipients(input?.placeOfWorshipId ? [input.placeOfWorshipId] : undefined);
    }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const recipient = await findRecipientById(input.id);
      if (!recipient) return null;
      if (ctx.user.role === "manager") {
        const placeIds = await findPlaceIdsByManagerId(ctx.user.id);
        if (!placeIds.includes(recipient.placeOfWorshipId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak berwenang mengakses data penerima ini.",
          });
        }
      }
      return recipient;
    }),

  create: authedQuery
    .input(
      z.object({
        nik: z.string().length(16),
        name: z.string().min(1),
        birthDate: z.string().optional(),
        gender: z.enum(["male", "female"]).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        familyMembers: z.number().min(1).default(1),
        incomePerMonth: z.number().min(0).default(0),
        placeOfWorshipId: z.number().min(1),
        registeredBy: z.number().optional(),
        notes: z.string().optional(),
        ktpDocument: z.string().min(1),
        kkDocument: z.string().min(1),
        sktmDocument: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role === "manager") {
        const placeIds = await findPlaceIdsByManagerId(ctx.user.id);
        if (!placeIds.includes(input.placeOfWorshipId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda hanya berwenang mendaftarkan penerima untuk rumah ibadah yang Anda kelola.",
          });
        }
      }

      const created = await createRecipient({
        ...input,
        latitude: input.latitude?.toString() ?? null,
        longitude: input.longitude?.toString() ?? null,
        birthDate: input.birthDate ?? null,
        gender: input.gender ?? null,
        address: input.address ?? null,
        phone: input.phone ?? null,
        registeredBy: input.registeredBy ?? null,
        notes: input.notes ?? null,
        ktpDocument: input.ktpDocument,
        kkDocument: input.kkDocument,
        sktmDocument: input.sktmDocument ?? null,
        status: "pending",
      });

      if (created) {
        await logActivitySafe({
          userId: ctx.user.id,
          action: "CREATE",
          entityType: "recipient",
          entityId: created.id,
          details: `Mendaftarkan ${created.name}`,
        });
      }

      return created;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        nik: z.string().length(16).optional(),
        name: z.string().min(1).optional(),
        birthDate: z.string().optional(),
        gender: z.enum(["male", "female"]).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        familyMembers: z.number().min(1).optional(),
        incomePerMonth: z.number().min(0).optional(),
        placeOfWorshipId: z.number().optional(),
        notes: z.string().optional(),
        ktpDocument: z.string().optional(),
        kkDocument: z.string().optional(),
        sktmDocument: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const beforeUpdate = await findRecipientById(id);
      if (!beforeUpdate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Penerima tidak ditemukan." });
      }

      if (ctx.user.role === "manager") {
        const placeIds = await findPlaceIdsByManagerId(ctx.user.id);
        if (
          !placeIds.includes(beforeUpdate.placeOfWorshipId) ||
          (input.placeOfWorshipId && !placeIds.includes(input.placeOfWorshipId))
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak berwenang mengubah data penerima ini.",
          });
        }
      }

      const updateData: Record<string, unknown> = { ...data };
      if (data.latitude !== undefined) updateData.latitude = data.latitude.toString();
      if (data.longitude !== undefined) updateData.longitude = data.longitude.toString();
      const updated = await updateRecipient(id, updateData);

      if (updated) {
        await logActivitySafe({
          userId: ctx.user.id,
          action: "UPDATE",
          entityType: "recipient",
          entityId: updated.id,
          details: `Memperbarui data ${updated.name}`,
        });
      }

      return updated;
    }),

  verify: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "rejected"]),
        verifiedBy: z.number(),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify is only allowed for Admin and Officer
      if (ctx.user.role !== "admin" && ctx.user.role !== "officer") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Hanya petugas verifikasi atau administrator yang dapat memverifikasi kelayakan.",
        });
      }

      const verified = await verifyRecipient(input.id, input.status, input.verifiedBy, input.rejectionReason);
      if (verified) {
        const statusText = input.status === "active" ? "Diterima" : "Ditolak";
        await logActivitySafe({
          userId: input.verifiedBy,
          action: "VERIFY",
          entityType: "recipient",
          entityId: verified.id,
          details: `Memverifikasi ${verified.name} - ${statusText}`,
        });
      }
      return verified;
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const target = await findRecipientById(input.id);
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Penerima tidak ditemukan." });
      }

      if (ctx.user.role === "manager") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pengelola rumah ibadah tidak berwenang menghapus data penerima.",
        });
      }

      await deleteRecipient(input.id);

      if (target) {
        await logActivitySafe({
          userId: ctx.user.id,
          action: "DELETE",
          entityType: "recipient",
          entityId: target.id,
          details: `Menghapus penerima ${target.name}`,
        });
      }

      return { success: true };
    }),
});
