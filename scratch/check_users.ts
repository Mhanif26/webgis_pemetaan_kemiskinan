import { sql } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { users } from "../db/schema";

async function check() {
  const db = getDb();
  const res = await db.execute(sql`SELECT id FROM users WHERE unionId = 'officer@example.com' LIMIT 1`);
  console.log("Raw query result for officer:", res);
  
  const allUsers = await db.select().from(users);
  console.log("Current Users in DB:");
  console.table(allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
  process.exit(0);
}

check().catch(console.error);
