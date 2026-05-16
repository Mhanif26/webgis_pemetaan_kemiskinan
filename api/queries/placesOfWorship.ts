import { eq, like, and, count, desc } from "drizzle-orm";
import { getDb } from "./connection";
import { placesOfWorship } from "@db/schema";
import type { InsertPlaceOfWorship } from "@db/schema";

export async function findAllPlaces(search?: string, type?: string, active?: string) {
  const db = getDb();
  const conditions = [];
  if (search) {
    conditions.push(like(placesOfWorship.name, `%${search}%`));
  }
  if (type && type !== "all") {
    conditions.push(eq(placesOfWorship.type, type as "mosque" | "church" | "temple" | "vihara" | "other"));
  }
  if (active && active !== "all") {
    conditions.push(eq(placesOfWorship.isActive, active as "yes" | "no"));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(placesOfWorship).where(where).orderBy(desc(placesOfWorship.createdAt));
}

export async function findPlaceById(id: number) {
  const db = getDb();
  const rows = await db.select().from(placesOfWorship).where(eq(placesOfWorship.id, id)).limit(1);
  return rows.at(0) ?? null;
}

export async function createPlace(data: InsertPlaceOfWorship) {
  const db = getDb();
  const [{ id }] = await db.insert(placesOfWorship).values(data).$returningId();
  return findPlaceById(id);
}

export async function updatePlace(id: number, data: Partial<InsertPlaceOfWorship>) {
  const db = getDb();
  await db.update(placesOfWorship).set(data).where(eq(placesOfWorship.id, id));
  return findPlaceById(id);
}

export async function deletePlace(id: number) {
  const db = getDb();
  await db.delete(placesOfWorship).where(eq(placesOfWorship.id, id));
}

export async function countPlaces() {
  const db = getDb();
  const result = await db.select({ count: count() }).from(placesOfWorship);
  return result[0]?.count ?? 0;
}

export async function countActivePlaces() {
  const db = getDb();
  const result = await db.select({ count: count() })
    .from(placesOfWorship)
    .where(eq(placesOfWorship.isActive, "yes"));
  return result[0]?.count ?? 0;
}
