import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllDistributions,
  findDistributionById,
  createDistribution,
  deleteDistribution,
} from "./queries/distributions";
import { findRecipientById } from "./queries/recipients";
import { createActivityLog } from "./queries/activityLogs";

async function logActivitySafe(payload: Parameters<typeof createActivityLog>[0]) {
  try {
    await createActivityLog(payload);
  } catch (error) {
    console.warn("[activity] failed to write distribution activity", error);
  }
}

export const distributionRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        placeOfWorshipId: z.number().optional(),
        recipientId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return findAllDistributions(input?.placeOfWorshipId, input?.recipientId);
    }),

  create: publicQuery
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
    .mutation(async ({ input }) => {
      const created = await createDistribution({
        ...input,
        amount: input.amount.toString(),
        distributedBy: input.distributedBy ?? null,
        notes: input.notes ?? null,
      });

      if (created) {
        const recipient = await findRecipientById(created.recipientId);
        await logActivitySafe({
          userId: input.distributedBy ?? null,
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

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const target = await findDistributionById(input.id);
      await deleteDistribution(input.id);

      if (target) {
        await logActivitySafe({
          userId: target.distributedBy ?? null,
          action: "DELETE",
          entityType: "distribution",
          entityId: target.id,
          details: `Menghapus distribusi ${target.aidType}`,
        });
      }

      return { success: true };
    }),
});
