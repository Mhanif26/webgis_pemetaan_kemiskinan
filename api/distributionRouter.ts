import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllDistributions,
  createDistribution,
  deleteDistribution,
} from "./queries/distributions";

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
      return createDistribution({
        ...input,
        amount: input.amount.toString(),
        distributedBy: input.distributedBy ?? null,
        notes: input.notes ?? null,
      });
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteDistribution(input.id);
      return { success: true };
    }),
});
