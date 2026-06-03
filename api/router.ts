import { authRouter } from "./auth-router";
import { placeOfWorshipRouter } from "./placeOfWorshipRouter";
import { recipientRouter } from "./recipientRouter";
import { distributionRouter } from "./distributionRouter";
import { dashboardRouter } from "./dashboardRouter";
import { seedRouter } from "./seedRouter";
import { userRouter } from "./userRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  placeOfWorship: placeOfWorshipRouter,
  recipient: recipientRouter,
  distribution: distributionRouter,
  dashboard: dashboardRouter,
  seed: seedRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
