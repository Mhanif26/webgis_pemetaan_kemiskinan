import { seedLocalUserIfMissing } from "../api/auth";

async function forceSeed() {
  console.log("Starting force seed...");
  await seedLocalUserIfMissing();
  console.log("Force seed completed.");
  process.exit(0);
}

forceSeed().catch(console.error);
