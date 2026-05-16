import { desc, count } from "drizzle-orm";
import { getDb } from "./connection";
import { activityLogs } from "@db/schema";
import type { InsertActivityLog } from "@db/schema";

export async function findRecentActivities(limit: number = 20) {
  const db = getDb();
  return db.select().from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function createActivityLog(data: InsertActivityLog) {
  const db = getDb();
  await db.insert(activityLogs).values(data);
}

export async function countActivities() {
  const db = getDb();
  const result = await db.select({ count: count() }).from(activityLogs);
  return result[0]?.count ?? 0;
}
