import type { Context } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const listBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
export async function getAll(c: Context) {
  const userId = c.get("userId");
  const lists = await prisma.list.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { listCards: true } } },
  });
  return c.json(lists);
}
//
export async function createOne(c: Context) {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = listBodySchema.safeParse(body);

  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const list = await prisma.list.create({
    data: { ...parsed.data, userId },
  });
  return c.json(list, 201);
}

export async function getOne(c: Context) {
  const userId = c.get("userId");
  const list = await prisma.list.findFirst({
    where: { id: c.req.param("id"), userId },
    include: {
      listCards: { include: { card: true }, orderBy: { addedAt: "desc" } },
    },
  });

  if (!list) return c.json({ error: "List not found" }, 404);
  return c.json(list);
}

export async function updateOne(c: Context) {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = listBodySchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const existing = await prisma.list.findFirst({
    where: { id: c.req.param("id"), userId },
  });
  if (!existing) return c.json({ error: "List not found" }, 404);

  const list = await prisma.list.update({
    where: { id: c.req.param("id") },
    data: parsed.data,
  });
  return c.json(list);
}

export async function deleteOne(c: Context) {
  const userId = c.get("userId");
  const existing = await prisma.list.findFirst({
    where: { id: c.req.param("id"), userId },
  });
  if (!existing) return c.json({ error: "List not found" }, 404);

  await prisma.list.delete({ where: { id: c.req.param("id") } });
  return c.json({ success: true });
}
