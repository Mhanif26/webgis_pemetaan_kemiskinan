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
import { createActivityLog } from "./queries/activityLogs";

async function logActivitySafe(payload: Parameters<typeof createActivityLog>[0]) {
  try {
    await createActivityLog(payload);
  } catch (error) {
    console.warn("[activity] failed to write recipient activity", error);
  }
}

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
        status: "pending",
      });

      if (created) {
        await logActivitySafe({
          userId: input.registeredBy ?? null,
          action: "CREATE",
          entityType: "recipient",
          entityId: created.id,
          details: `Mendaftarkan ${created.name}`,
        });
      }

      return created;
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
      const beforeUpdate = await findRecipientById(id);
      const updateData: Record<string, unknown> = { ...data };
      if (data.latitude !== undefined) updateData.latitude = data.latitude.toString();
      if (data.longitude !== undefined) updateData.longitude = data.longitude.toString();
      const updated = await updateRecipient(id, updateData);

      if (updated) {
        await logActivitySafe({
          userId: beforeUpdate?.registeredBy ?? null,
          action: "UPDATE",
          entityType: "recipient",
          entityId: updated.id,
          details: `Memperbarui data ${updated.name}`,
        });
      }

      return updated;
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

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const target = await findRecipientById(input.id);
      await deleteRecipient(input.id);

      if (target) {
        await logActivitySafe({
          userId: target.registeredBy ?? null,
          action: "DELETE",
          entityType: "recipient",
          entityId: target.id,
          details: `Menghapus penerima ${target.name}`,
        });
      }

      return { success: true };
    }),
});
