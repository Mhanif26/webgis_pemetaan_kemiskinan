import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import {
  findAllPlaces,
  findPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
} from "./queries/placesOfWorship";
import { createActivityLog } from "./queries/activityLogs";

async function logActivitySafe(payload: Parameters<typeof createActivityLog>[0]) {
  try {
    await createActivityLog(payload);
  } catch (error) {
    console.warn("[activity] failed to write place activity", error);
  }
}

export const placeOfWorshipRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        type: z.string().optional(),
        active: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const managerId = ctx.user?.role === "manager" ? ctx.user.id : undefined;
      return findAllPlaces(input?.search, input?.type, input?.active, managerId);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findPlaceById(input.id);
    }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["mosque", "church", "temple", "vihara", "other"]),
        address: z.string().optional(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radius: z.number().min(100).max(10000).default(1000),
        capacity: z.number().min(1).max(10000).default(100),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        managerId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const created = await createPlace({
        ...input,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        managerId: input.managerId ?? null,
      });

      if (created) {
        await logActivitySafe({
          userId: input.managerId ?? null,
          action: "CREATE",
          entityType: "place_of_worship",
          entityId: created.id,
          details: `Menambahkan ${created.name}`,
        });
      }

      return created;
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.enum(["mosque", "church", "temple", "vihara", "other"]).optional(),
        address: z.string().optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        radius: z.number().min(100).max(10000).optional(),
        capacity: z.number().min(1).max(10000).optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        managerId: z.number().optional(),
        isActive: z.enum(["yes", "no"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const beforeUpdate = await findPlaceById(id);
      const updateData: Record<string, unknown> = { ...data };
      if (data.latitude !== undefined) updateData.latitude = data.latitude.toString();
      if (data.longitude !== undefined) updateData.longitude = data.longitude.toString();
      if (data.managerId === undefined) delete updateData.managerId;
      const updated = await updatePlace(id, updateData);

      if (updated) {
        await logActivitySafe({
          userId: data.managerId ?? beforeUpdate?.managerId ?? null,
          action: "UPDATE",
          entityType: "place_of_worship",
          entityId: updated.id,
          details: `Memperbarui rumah ibadah ${updated.name}`,
        });
      }

      return updated;
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const target = await findPlaceById(input.id);
      await deletePlace(input.id);

      if (target) {
        await logActivitySafe({
          userId: target.managerId ?? null,
          action: "DELETE",
          entityType: "place_of_worship",
          entityId: target.id,
          details: `Menghapus rumah ibadah ${target.name}`,
        });
      }

      return { success: true };
    }),
});
