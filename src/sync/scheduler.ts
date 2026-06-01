import cron from "node-cron";
import { runIncrementalSync } from "./optcg.sync.js";

export function startScheduler() {
  // Daily at 03:00 UTC
  cron.schedule("0 3 * * *", async () => {
    try {
      await runIncrementalSync();
    } catch (err) {
      console.error("[sync] Scheduled sync failed:", err);
    }
  });
  console.log("[scheduler] Daily card sync scheduled at 03:00 UTC");
}
