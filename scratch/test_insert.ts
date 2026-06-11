import { getDb } from "../api/queries/connection";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();
  try {
    const [result] = await db.execute(sql`DESCRIBE recipients`);
    console.log("RECIPIENTS TABLE STRUCTURE:", result);
  } catch (err) {
    console.error("ERROR DESCRIBING TABLE:", err);
  }
  process.exit(0);
}

main().catch(console.error);
