import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { prisma } from "./lib/prisma.js";
import { authRouter } from "./routes/auth.js";
import { cardsRouter } from "./routes/cards.js";
import { listsRouter } from "./routes/lists.js";
import { runFullSync } from "./sync/optcg.sync.js";
import { startScheduler } from "./sync/scheduler.js";

const app = new Hono();

app.use("*", cors());

app.route("/auth", authRouter);
app.route("/cards", cardsRouter);
app.route("/lists", listsRouter);

app.get("/health", (c) => c.json({ status: "ok" }));

const PORT = Number(process.env["PORT"] ?? 3000);

async function bootstrap() {
  const cardCount = await prisma.card.count();
  if (cardCount === 0) {
    await runFullSync();
  }

  startScheduler();

  serve({ fetch: app.fetch, port: PORT });
  console.log(`Server running on http://localhost:${PORT}`);
  showRoutes(app);
}

bootstrap().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
