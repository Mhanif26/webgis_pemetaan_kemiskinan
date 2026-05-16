import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllRecipients,
  findRecipientById,
  findPendingRecipients,
  createRecipient,
  updateRecipient,
  verifyRecipient,
  deleteRecipient,
} from "./queries/recipients";

export const recipientRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        placeOfWorshipId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return findAllRecipients(input?.search, input?.status, input?.placeOfWorshipId);
    }),

  pending: publicQuery
    .input(z.object({ placeOfWorshipId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return findPendingRecipients(input?.placeOfWorshipId);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findRecipientById(input.id);
    }),

  create: publicQuery
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
      })
    )
    .mutation(async ({ input }) => {
      return createRecipient({
        ...input,
        latitude: input.latitude?.toString() ?? null,
        longitude: input.longitude?.toString() ?? null,
        birthDate: input.birthDate ?? null,
        gender: input.gender ?? null,
        address: input.address ?? null,
        phone: input.phone ?? null,
        registeredBy: input.registeredBy ?? null,
        notes: input.notes ?? null,
        status: "pending",
      });
    }),

  update: publicQuery
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
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.latitude !== undefined) updateData.latitude = data.latitude.toString();
      if (data.longitude !== undefined) updateData.longitude = data.longitude.toString();
      return updateRecipient(id, updateData);
    }),

  verify: publicQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "rejected"]),
        verifiedBy: z.number(),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return verifyRecipient(input.id, input.status, input.verifiedBy, input.rejectionReason);
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteRecipient(input.id);
      return { success: true };
    }),
});
