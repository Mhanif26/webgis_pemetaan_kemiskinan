import crypto from "node:crypto";
import * as cookie from "cookie";
import { sql } from "drizzle-orm";
import { Errors } from "@contracts/errors";
import { LocalAuth, Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken, verifySessionToken } from "./session";
import { findUserByLoginIdentifier, findUserByUnionId, touchUserLastSignIn } from "./queries/users";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH) as Buffer;
  const stored = Buffer.from(hash, "hex");
  if (stored.length !== derived.length) {
    return false;
  }
  return crypto.timingSafeEqual(stored, derived);
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    console.warn("[auth] No session cookie found in request.");
    throw Errors.forbidden("Invalid authentication token.");
  }

  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }

  return user;
}

export async function loginWithCredentials(
  identifier: string,
  password: string,
) {
  const user = await findUserByLoginIdentifier(identifier);
  if (!user || !user.passwordHash) {
    throw Errors.forbidden("Invalid username or password.");
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw Errors.forbidden("Invalid username or password.");
  }

  await touchUserLastSignIn(user.unionId);

  const token = await signSessionToken({
    unionId: user.unionId,
    clientId: "local",
  });

  return { user, token };
}

export function setSessionCookie(headers: Headers, token: string) {
  const cookieOpts = getSessionCookieOptions(headers);
  headers.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: cookieOpts.httpOnly,
      path: cookieOpts.path,
      sameSite: cookieOpts.sameSite?.toLowerCase() as "lax" | "none",
      secure: cookieOpts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

export async function seedLocalUserIfMissing() {
  const db = getDb();
  // Ensure `password_hash` column exists (older DBs may lack it)
  try {
    const [colCheck] = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password_hash'
    `);
    // colCheck can be an array of rows depending on driver
    let count = 0;
    if (Array.isArray(colCheck) && colCheck.length > 0) {
      const first = colCheck[0];
      count = Number(Object.values(first)[0]);
    }
    if (count === 0) {
      await db.execute(sql`ALTER TABLE users ADD COLUMN password_hash TEXT`);
    }
  } catch (err) {
    // If checking or altering fails, log and continue — seed will still try insert without password if necessary
    console.warn('[seed] failed to ensure password_hash column exists', err);
  }
  // Check existence without selecting `password_hash` to avoid failures on older schemas
  try {
    const [rows] = await db.execute(sql`SELECT id FROM users WHERE unionId = ${LocalAuth.defaultAdminEmail} LIMIT 1`);
  } catch (err) {
    console.warn('[seed] existence check failed, will attempt to insert anyway', err);
  }

  // 1. Ensure admin account
  try {
    const [existingAdmin] = await db.execute(sql`SELECT id FROM users WHERE unionId = ${LocalAuth.defaultAdminEmail} LIMIT 1`);
    if (!existingAdmin || (Array.isArray(existingAdmin) && existingAdmin.length === 0)) {
      await db.insert(users).values({
        unionId: LocalAuth.defaultAdminEmail,
        name: "Admin Lokal",
        email: LocalAuth.defaultAdminEmail,
        passwordHash: hashPassword(LocalAuth.defaultAdminPassword),
        role: "admin",
        lastSignInAt: new Date(),
      });
      console.log(`[seed] Created admin account: ${LocalAuth.defaultAdminEmail}`);
    }
  } catch (err) {
    console.warn('[seed] Admin seeding failed, attempting fallback', err);
    try {
      await db.execute(sql`INSERT IGNORE INTO users (unionId, name, email, role, lastSignInAt) VALUES (
        ${LocalAuth.defaultAdminEmail}, ${'Admin Lokal'}, ${LocalAuth.defaultAdminEmail}, ${'admin'}, ${new Date()}
      )`);
    } catch (err2) {
      console.error('[seed] Admin fallback failed', err2);
    }
  }

  // 2. Seed default roles for testing
  const defaultAccounts = [
    { email: "officer@example.com", name: "Petugas Lapangan", role: "officer" as const },
    { email: "manager@example.com", name: "Pengelola Wilayah", role: "manager" as const },
  ];

  for (const acc of defaultAccounts) {
    try {
      const res = await db.execute(sql`SELECT id FROM users WHERE unionId = ${acc.email} LIMIT 1`);
      const [existing] = res as any;
      
      if (existing && (!Array.isArray(existing) || existing.length > 0)) {
        continue;
      }

      await db.insert(users).values({
        unionId: acc.email,
        name: acc.name,
        email: acc.email,
        passwordHash: hashPassword("password123"),
        role: acc.role,
        lastSignInAt: new Date(),
      });
      console.log(`[seed] Created ${acc.role} account: ${acc.email}`);
    } catch (err) {
      console.warn(`[seed] Failed to create ${acc.role} (${acc.email})`, err);
    }
  }
}