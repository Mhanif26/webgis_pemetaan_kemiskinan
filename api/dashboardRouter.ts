import { createRouter, publicQuery } from "./middleware";
import { getDashboardStats } from "./queries/dashboard";
import { findRecentActivities } from "./queries/activityLogs";
import { z } from "zod";

export const dashboardRouter = createRouter({
  stats: publicQuery.query(async () => {
    return getDashboardStats();
  }),

  activities: publicQuery
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      return findRecentActivities(input?.limit ?? 20);
    }),
});
