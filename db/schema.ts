import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  index,
} from "drizzle-orm/mysql-core";

// ── Users (base auth table) ──────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["admin", "officer", "manager"]).default("manager").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Places of Worship ─────────────────────────────────────────
export const placesOfWorship = mysqlTable(
  "places_of_worship",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["mosque", "church", "temple", "vihara", "other"]).notNull(),
    address: text("address"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    radius: int("radius").default(1000).notNull(), // radius in meters
    capacity: int("capacity").default(100).notNull(), // max beneficiaries
    contactName: varchar("contact_name", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 20 }),
    managerId: bigint("manager_id", { mode: "number", unsigned: true }),
    isActive: mysqlEnum("is_active", ["yes", "no"]).default("yes").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    typeIdx: index("pow_type_idx").on(table.type),
    managerIdx: index("pow_manager_idx").on(table.managerId),
  })
);

export type PlaceOfWorship = typeof placesOfWorship.$inferSelect;
export type InsertPlaceOfWorship = typeof placesOfWorship.$inferInsert;

// ── Recipients (beneficiaries) ─────────────────────────────────
export const recipients = mysqlTable(
  "recipients",
  {
    id: serial("id").primaryKey(),
    nik: varchar("nik", { length: 16 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    birthDate: varchar("birth_date", { length: 10 }),
    gender: mysqlEnum("gender", ["male", "female"]),
    address: text("address"),
    phone: varchar("phone", { length: 15 }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    familyMembers: int("family_members").default(1),
    incomePerMonth: int("income_per_month").default(0),
    status: mysqlEnum("status", ["pending", "active", "rejected", "suspended"]).default("pending").notNull(),
    rejectionReason: text("rejection_reason"),
    placeOfWorshipId: bigint("place_of_worship_id", { mode: "number", unsigned: true }).notNull(),
    registeredBy: bigint("registered_by", { mode: "number", unsigned: true }),
    verifiedBy: bigint("verified_by", { mode: "number", unsigned: true }),
    verifiedAt: timestamp("verified_at"),
    notes: text("notes"),
    ktpDocument: text("ktp_document"),
    kkDocument: text("kk_document"),
    sktmDocument: text("sktm_document"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    nikIdx: index("rec_nik_idx").on(table.nik),
    statusIdx: index("rec_status_idx").on(table.status),
    powIdx: index("rec_pow_idx").on(table.placeOfWorshipId),
  })
);

export type Recipient = typeof recipients.$inferSelect;
export type InsertRecipient = typeof recipients.$inferInsert;

// ── Distributions ──────────────────────────────────────────────
export const distributions = mysqlTable(
  "distributions",
  {
    id: serial("id").primaryKey(),
    placeOfWorshipId: bigint("place_of_worship_id", { mode: "number", unsigned: true }).notNull(),
    recipientId: bigint("recipient_id", { mode: "number", unsigned: true }).notNull(),
    distributedBy: bigint("distributed_by", { mode: "number", unsigned: true }),
    aidType: varchar("aid_type", { length: 100 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).default("0.00"),
    quantity: int("quantity").default(1),
    unit: varchar("unit", { length: 50 }).default("package"),
    distributionDate: timestamp("distribution_date").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    powIdx: index("dist_pow_idx").on(table.placeOfWorshipId),
    recIdx: index("dist_rec_idx").on(table.recipientId),
  })
);

export type Distribution = typeof distributions.$inferSelect;
export type InsertDistribution = typeof distributions.$inferInsert;

// ── Activity Logs ──────────────────────────────────────────────
export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true }),
    action: varchar("action", { length: 50 }).notNull(), // e.g. "CREATE", "UPDATE", "DELETE", "VERIFY"
    entityType: varchar("entity_type", { length: 50 }).notNull(), // "recipient", "place_of_worship", "distribution"
    entityId: bigint("entity_id", { mode: "number", unsigned: true }),
    details: text("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("act_user_idx").on(table.userId),
    entityIdx: index("act_entity_idx").on(table.entityType, table.entityId),
  })
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
