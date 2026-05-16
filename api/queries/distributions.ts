import { eq, and, desc, count, sql } from "drizzle-orm";
import { getDb } from "./connection";
import { distributions } from "@db/schema";
import type { InsertDistribution } from "@db/schema";

export async function findAllDistributions(placeOfWorshipId?: number, recipientId?: number) {
  const db = getDb();
  const conditions = [];
  if (placeOfWorshipId) conditions.push(eq(distributions.placeOfWorshipId, placeOfWorshipId));
  if (recipientId) conditions.push(eq(distributions.recipientId, recipientId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(distributions).where(where).orderBy(desc(distributions.distributionDate));
}

export async function findDistributionById(id: number) {
  const db = getDb();
  const rows = await db.select().from(distributions).where(eq(distributions.id, id)).limit(1);
  return rows.at(0) ?? null;
}

export async function createDistribution(data: InsertDistribution) {
  const db = getDb();
  const [{ id }] = await db.insert(distributions).values(data).$returningId();
  return findDistributionById(id);
}

export async function deleteDistribution(id: number) {
  const db = getDb();
  await db.delete(distributions).where(eq(distributions.id, id));
}

export async function countDistributions() {
  const db = getDb();
  const result = await db.select({ count: count() }).from(distributions);
  return result[0]?.count ?? 0;
}

export async function sumDistributionAmount() {
  const db = getDb();
  const result = await db.select({ total: sql<number>`COALESCE(SUM(${distributions.amount}), 0)` })
    .from(distributions);
  return result[0]?.total ?? 0;
}
