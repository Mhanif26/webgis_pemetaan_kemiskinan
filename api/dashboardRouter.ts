import { createRouter, authedQuery } from "./middleware";
import { getDashboardStats } from "./queries/dashboard";
import { findRecentActivities } from "./queries/activityLogs";
import { findPlaceIdsByManagerId } from "./queries/placesOfWorship";
import { z } from "zod";

export const dashboardRouter = createRouter({
  stats: authedQuery.query(async ({ ctx }) => {
    if (ctx.user.role === "manager") {
      const placeIds = await findPlaceIdsByManagerId(ctx.user.id);
      return getDashboardStats(placeIds);
    }
    return getDashboardStats();
  }),

  activities: authedQuery
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      return findRecentActivities(input?.limit ?? 20);
    }),
});
