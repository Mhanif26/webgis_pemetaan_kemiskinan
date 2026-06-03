import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAllDistributions,
  findDistributionById,
  createDistribution,
  deleteDistribution,
} from "./queries/distributions";
import { findRecipientById } from "./queries/recipients";
import { createActivityLog } from "./queries/activityLogs";
import { findPlaceIdsByManagerId } from "./queries/placesOfWorship";
import { TRPCError } from "@trpc/server";

async function logActivitySafe(payload: Parameters<typeof createActivityLog>[0]) {
  try {
    await createActivityLog(payload);
  } catch (error) {
    console.warn("[activity] failed to write distribution activity", error);
  }
}

export const distributionRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        placeOfWorshipId: z.number().optional(),
        recipientId: z.number().optional(),
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
              message: "Anda tidak berwenang mengakses data distribusi ini.",
            });
          }
          return findAllDistributions([input.placeOfWorshipId], input?.recipientId);
        }
        return findAllDistributions(placeIds, input?.recipientId);
      }
      return findAllDistributions(
        input?.placeOfWorshipId ? [input.placeOfWorshipId] : undefined,
        input?.recipientId
      );
    }),

  create: authedQuery
    .input(
      z.object({
        placeOfWorshipId: z.number().min(1),
        recipientId: z.number().min(1),
        distributedBy: z.number().optional(),
        aidType: z.string().min(1),
        amount: z.number().min(0).default(0),
        quantity: z.number().min(1).default(1),
        unit: z.string().default("package"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role === "manager") {
        const placeIds = await findPlaceIdsByManagerId(ctx.user.id);
        if (!placeIds.includes(input.placeOfWorshipId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda hanya berwenang mencatat distribusi bantuan untuk rumah ibadah yang Anda kelola.",
          });
        }
      }

      const created = await createDistribution({
        ...input,
        amount: input.amount.toString(),
        distributedBy: input.distributedBy ?? null,
        notes: input.notes ?? null,
      });

      if (created) {
        const recipient = await findRecipientById(created.recipientId);
        await logActivitySafe({
          userId: ctx.user.id,
          action: "CREATE",
          entityType: "distribution",
          entityId: created.id,
          details: recipient
            ? `Distribusi ${created.aidType} ke ${recipient.name}`
            : `Distribusi ${created.aidType}`,
        });
      }

      return created;
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const target = await findDistributionById(input.id);
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Data tidak ditemukan." });
      }

      if (ctx.user.role === "manager") {
        const placeIds = await findPlaceIdsByManagerId(ctx.user.id);
        if (!placeIds.includes(target.placeOfWorshipId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak berwenang menghapus data distribusi ini.",
          });
        }
      }

      await deleteDistribution(input.id);

      if (target) {
        await logActivitySafe({
          userId: ctx.user.id,
          action: "DELETE",
          entityType: "distribution",
          entityId: target.id,
          details: `Menghapus distribusi ${target.aidType}`,
        });
      }

      return { success: true };
    }),
});
