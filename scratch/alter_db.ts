import { getDb } from "../api/queries/connection";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();
  try {
    console.log("Altering recipients table columns to LONGTEXT...");
    await db.execute(sql`ALTER TABLE recipients MODIFY COLUMN ktp_document LONGTEXT`);
    await db.execute(sql`ALTER TABLE recipients MODIFY COLUMN kk_document LONGTEXT`);
    await db.execute(sql`ALTER TABLE recipients MODIFY COLUMN sktm_document LONGTEXT`);
    console.log("Database altered successfully!");
  } catch (err) {
    console.error("ERROR ALTERING TABLE:", err);
  }
  process.exit(0);
}

main().catch(console.error);
