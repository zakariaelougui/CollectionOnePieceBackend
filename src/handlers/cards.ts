import type { Context } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// Handler for fetching all cards with optional filters and pagination
export const getAllCards = async (c: Context) => {
  const querySchema = z.object({
    search: z.string().optional(),
    color: z.string().optional(),
    type: z.string().optional(),
    setId: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  });

  const parsed = querySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const { search, color, type, setId, page, limit } = parsed.data;

  const where = {
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
    ...(color && { color }),
    ...(type && { type }),
    ...(setId && { setId }),
  };

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.card.count({ where }),
  ]);

  return c.json({ cards, total, page, limit });
};

export const getCardById = async (c: Context) => {
  const card = await prisma.card.findUnique({
    where: { id: c.req.param("id") },
  });
  if (!card) return c.json({ error: "Card not found" }, 404);
  return c.json(card);
};
