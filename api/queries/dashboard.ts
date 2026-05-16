import { sql, eq } from "drizzle-orm";
import { getDb } from "./connection";
import { recipients, placesOfWorship, distributions } from "@db/schema";

export async function getDashboardStats() {
  const db = getDb();

  const totalRecipients = await db.select({ count: sql<number>`COUNT(*)` }).from(recipients);
  const activeRecipients = await db.select({ count: sql<number>`COUNT(*)` })
    .from(recipients)
    .where(eq(recipients.status, "active"));
  const pendingRecipients = await db.select({ count: sql<number>`COUNT(*)` })
    .from(recipients)
    .where(eq(recipients.status, "pending"));
  const totalPlaces = await db.select({ count: sql<number>`COUNT(*)` }).from(placesOfWorship);
  const activePlaces = await db.select({ count: sql<number>`COUNT(*)` })
    .from(placesOfWorship)
    .where(eq(placesOfWorship.isActive, "yes"));
  const totalDistributions = await db.select({ count: sql<number>`COUNT(*)` }).from(distributions);
  const totalAidAmount = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(distributions);

  const byType = await db.select({
    type: placesOfWorship.type,
    count: sql<number>`COUNT(*)`,
  }).from(placesOfWorship).groupBy(placesOfWorship.type);

  const byStatus = await db.select({
    status: recipients.status,
    count: sql<number>`COUNT(*)`,
  }).from(recipients).groupBy(recipients.status);

  const monthlyDist = await db.select({
    month: sql<string>`DATE_FORMAT(distribution_date, '%Y-%m')`,
    count: sql<number>`COUNT(*)`,
    amount: sql<number>`COALESCE(SUM(amount), 0)`,
  }).from(distributions)
    .groupBy(sql`DATE_FORMAT(distribution_date, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(distribution_date, '%Y-%m')`)
    .limit(12);

  return {
    totalRecipients: totalRecipients[0]?.count ?? 0,
    activeRecipients: activeRecipients[0]?.count ?? 0,
    pendingRecipients: pendingRecipients[0]?.count ?? 0,
    totalPlaces: totalPlaces[0]?.count ?? 0,
    activePlaces: activePlaces[0]?.count ?? 0,
    totalDistributions: totalDistributions[0]?.count ?? 0,
    totalAidAmount: Number(totalAidAmount[0]?.total ?? 0),
    byType,
    byStatus,
    monthlyDist,
  };
}
