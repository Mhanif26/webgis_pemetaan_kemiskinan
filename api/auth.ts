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
    if (Array.isArray(rows) && rows.length > 0) return;
  } catch (err) {
    console.warn('[seed] existence check failed, will attempt to insert anyway', err);
  }

  // Try to insert using the typed Drizzle insert (preferred). If that fails because the
  // `password_hash` column is missing, fall back to a raw INSERT that omits the column.
  try {
    await db.insert(users).values({
      unionId: LocalAuth.defaultAdminEmail,
      name: "Admin Lokal",
      email: LocalAuth.defaultAdminEmail,
      passwordHash: hashPassword(LocalAuth.defaultAdminPassword),
      role: "admin",
      lastSignInAt: new Date(),
    });
  } catch (err) {
    console.warn('[seed] typed insert failed, attempting fallback insert without password_hash', err);
    try {
      await db.execute(sql`INSERT INTO users (unionId, name, email, role, lastSignInAt) VALUES (
        ${LocalAuth.defaultAdminEmail}, ${'Admin Lokal'}, ${LocalAuth.defaultAdminEmail}, ${'admin'}, ${new Date()}
      )`);
    } catch (err2) {
      console.error('[seed] fallback insert also failed', err2);
    }
  }
}