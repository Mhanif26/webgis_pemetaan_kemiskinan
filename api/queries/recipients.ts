import { eq, like, and, count, desc } from "drizzle-orm";
import { getDb } from "./connection";
import { recipients } from "@db/schema";
import type { InsertRecipient } from "@db/schema";

export async function findAllRecipients(
  search?: string,
  status?: string,
  placeOfWorshipId?: number
) {
  const db = getDb();
  const conditions = [];
  if (search) {
    conditions.push(like(recipients.name, `%${search}%`));
  }
  if (status && status !== "all") {
    conditions.push(eq(recipients.status, status as "pending" | "active" | "rejected" | "suspended"));
  }
  if (placeOfWorshipId) {
    conditions.push(eq(recipients.placeOfWorshipId, placeOfWorshipId));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(recipients).where(where).orderBy(desc(recipients.createdAt));
}

export async function findRecipientById(id: number) {
  const db = getDb();
  const rows = await db.select().from(recipients).where(eq(recipients.id, id)).limit(1);
  return rows.at(0) ?? null;
}

export async function findPendingRecipients(placeOfWorshipId?: number) {
  const db = getDb();
  const conditions = [eq(recipients.status, "pending")];
  if (placeOfWorshipId) {
    conditions.push(eq(recipients.placeOfWorshipId, placeOfWorshipId));
  }
  return db.select().from(recipients)
    .where(and(...conditions))
    .orderBy(desc(recipients.createdAt));
}

export async function createRecipient(data: InsertRecipient) {
  const db = getDb();
  const [{ id }] = await db.insert(recipients).values(data).$returningId();
  return findRecipientById(id);
}

export async function updateRecipient(id: number, data: Partial<InsertRecipient>) {
  const db = getDb();
  await db.update(recipients).set(data).where(eq(recipients.id, id));
  return findRecipientById(id);
}

export async function verifyRecipient(
  id: number,
  status: "active" | "rejected",
  verifiedBy: number,
  rejectionReason?: string
) {
  return updateRecipient(id, {
    status,
    verifiedBy,
    verifiedAt: new Date(),
    rejectionReason: status === "rejected" ? rejectionReason : null,
  });
}

export async function deleteRecipient(id: number) {
  const db = getDb();
  await db.delete(recipients).where(eq(recipients.id, id));
}

export async function countRecipients(status?: string) {
  const db = getDb();
  const query = db.select({ count: count() }).from(recipients);
  if (status) {
    return query.where(eq(recipients.status, status as "pending" | "active" | "rejected" | "suspended"));
  }
  const result = await query;
  return result[0]?.count ?? 0;
}

export async function countActiveRecipients() {
  return countRecipients("active");
}

export async function countPendingRecipients() {
  return countRecipients("pending");
}
