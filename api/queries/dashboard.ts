import { sql, eq, inArray, and } from "drizzle-orm";
import { getDb } from "./connection";
import { recipients, placesOfWorship, distributions } from "@db/schema";

export async function getDashboardStats(placeOfWorshipIds?: number[]) {
  const db = getDb();

  if (placeOfWorshipIds !== undefined && placeOfWorshipIds.length === 0) {
    return {
      totalRecipients: 0,
      activeRecipients: 0,
      pendingRecipients: 0,
      totalPlaces: 0,
      activePlaces: 0,
      totalDistributions: 0,
      totalAidAmount: 0,
      byType: [],
      byStatus: [],
      monthlyDist: [],
    };
  }

  const hasFilter = placeOfWorshipIds !== undefined;

  const totalRecipients = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(recipients)
    .where(hasFilter ? inArray(recipients.placeOfWorshipId, placeOfWorshipIds) : undefined);

  const activeRecipients = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(recipients)
    .where(
      hasFilter
        ? and(inArray(recipients.placeOfWorshipId, placeOfWorshipIds), eq(recipients.status, "active"))
        : eq(recipients.status, "active")
    );

  const pendingRecipients = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(recipients)
    .where(
      hasFilter
        ? and(inArray(recipients.placeOfWorshipId, placeOfWorshipIds), eq(recipients.status, "pending"))
        : eq(recipients.status, "pending")
    );

  const totalPlaces = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(placesOfWorship)
    .where(hasFilter ? inArray(placesOfWorship.id, placeOfWorshipIds) : undefined);

  const activePlaces = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(placesOfWorship)
    .where(
      hasFilter
        ? and(inArray(placesOfWorship.id, placeOfWorshipIds), eq(placesOfWorship.isActive, "yes"))
        : eq(placesOfWorship.isActive, "yes")
    );

  const totalDistributions = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(distributions)
    .where(hasFilter ? inArray(distributions.placeOfWorshipId, placeOfWorshipIds) : undefined);

  const totalAidAmount = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(distributions)
    .where(hasFilter ? inArray(distributions.placeOfWorshipId, placeOfWorshipIds) : undefined);

  const byType = await db
    .select({
      type: placesOfWorship.type,
      count: sql<number>`COUNT(*)`,
    })
    .from(placesOfWorship)
    .where(hasFilter ? inArray(placesOfWorship.id, placeOfWorshipIds) : undefined)
    .groupBy(placesOfWorship.type);

  const byStatus = await db
    .select({
      status: recipients.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(recipients)
    .where(hasFilter ? inArray(recipients.placeOfWorshipId, placeOfWorshipIds) : undefined)
    .groupBy(recipients.status);

  const monthlyDist = await db
    .select({
      month: sql<string>`DATE_FORMAT(distribution_date, '%Y-%m')`,
      count: sql<number>`COUNT(*)`,
      amount: sql<number>`COALESCE(SUM(amount), 0)`,
    })
    .from(distributions)
    .where(hasFilter ? inArray(distributions.placeOfWorshipId, placeOfWorshipIds) : undefined)
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
