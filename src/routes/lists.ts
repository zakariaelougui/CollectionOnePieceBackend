import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createOne, deleteOne, getAll, getOne, updateOne } from "../handlers/lists.js";

type Variables = { userId: string };

export const listsRouter = new Hono<{ Variables: Variables }>();

listsRouter.use("*", authMiddleware);

// list methods
listsRouter.get("/", getAll);

listsRouter.post("/", createOne);

listsRouter.get("/:id", getOne);

listsRouter.put("/:id", updateOne);

listsRouter.delete("/:id", deleteOne);

// --- List card management ---

const listCardBodySchema = z.object({
  cardId: z.string(),
  quantity: z.number().int().positive().default(1),
});

listsRouter.get("/:id/cards", async (c) => {
  const userId = c.get("userId");
  const list = await prisma.list.findFirst({
    where: { id: c.req.param("id"), userId },
  });
  if (!list) return c.json({ error: "List not found" }, 404);

  const cards = await prisma.listCard.findMany({
    where: { listId: c.req.param("id") },
    include: { card: true },
    orderBy: { addedAt: "desc" },
  });
  return c.json(cards);
});

listsRouter.post("/:id/cards", async (c) => {
  const userId = c.get("userId");
  const list = await prisma.list.findFirst({
    where: { id: c.req.param("id"), userId },
  });
  if (!list) return c.json({ error: "List not found" }, 404);

  const body = await c.req.json();
  const parsed = listCardBodySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const cardExists = await prisma.card.findUnique({
    where: { id: parsed.data.cardId },
  });
  if (!cardExists) return c.json({ error: "Card not found" }, 404);

  const listCard = await prisma.listCard.upsert({
    where: {
      listId_cardId: { listId: c.req.param("id"), cardId: parsed.data.cardId },
    },
    create: { listId: c.req.param("id"), ...parsed.data },
    update: { quantity: { increment: parsed.data.quantity } },
    include: { card: true },
  });
  return c.json(listCard, 201);
});

listsRouter.put("/:id/cards/:cardId", async (c) => {
  const userId = c.get("userId");
  const list = await prisma.list.findFirst({
    where: { id: c.req.param("id"), userId },
  });
  if (!list) return c.json({ error: "List not found" }, 404);

  const body = await c.req.json();
  const { quantity } = z.object({ quantity: z.number().int().positive() }).parse(body);

  const listCard = await prisma.listCard.update({
    where: {
      listId_cardId: {
        listId: c.req.param("id"),
        cardId: c.req.param("cardId"),
      },
    },
    data: { quantity },
    include: { card: true },
  });
  return c.json(listCard);
});

listsRouter.delete("/:id/cards/:cardId", async (c) => {
  const userId = c.get("userId");
  const list = await prisma.list.findFirst({
    where: { id: c.req.param("id"), userId },
  });
  if (!list) return c.json({ error: "List not found" }, 404);

  await prisma.listCard.delete({
    where: {
      listId_cardId: {
        listId: c.req.param("id"),
        cardId: c.req.param("cardId"),
      },
    },
  });
  return c.json({ success: true });
});
