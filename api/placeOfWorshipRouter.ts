import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllPlaces,
  findPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
} from "./queries/placesOfWorship";

export const placeOfWorshipRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        type: z.string().optional(),
        active: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return findAllPlaces(input?.search, input?.type, input?.active);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findPlaceById(input.id);
    }),

  create: publicQuery
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
      return createPlace({
        ...input,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        managerId: input.managerId ?? null,
      });
    }),

  update: publicQuery
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
      const updateData: Record<string, unknown> = { ...data };
      if (data.latitude !== undefined) updateData.latitude = data.latitude.toString();
      if (data.longitude !== undefined) updateData.longitude = data.longitude.toString();
      if (data.managerId === undefined) delete updateData.managerId;
      return updatePlace(id, updateData);
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deletePlace(input.id);
      return { success: true };
    }),
});
