import { eq, or } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserByLoginIdentifier(identifier: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(or(eq(schema.users.unionId, identifier), eq(schema.users.email, identifier)))
    .limit(1);
  return rows.at(0);
}

export async function touchUserLastSignIn(unionId: string) {
  await getDb()
    .update(schema.users)
    .set({ lastSignInAt: new Date() })
    .where(eq(schema.users.unionId, unionId));
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function findAllUsers() {
  return getDb()
    .select({
      id: schema.users.id,
      unionId: schema.users.unionId,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      avatar: schema.users.avatar,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
      lastSignInAt: schema.users.lastSignInAt,
    })
    .from(schema.users)
    .orderBy(schema.users.createdAt);
}

export async function createUser(data: InsertUser) {
  const [result] = await getDb().insert(schema.users).values(data);
  return result;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const result = await getDb()
    .update(schema.users)
    .set(data)
    .where(eq(schema.users.id, id));
  return result;
}

export async function deleteUser(id: number) {
  await getDb()
    .delete(schema.users)
    .where(eq(schema.users.id, id));
}
