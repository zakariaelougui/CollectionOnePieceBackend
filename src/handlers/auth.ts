import type { Context } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/auth.service.js";

const credentialsSchema = z.object({
  username: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(16),
});

export async function register(c: Context) {
  const body = await c.req.json();

  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  console.log("Data parsed: ", parsed.data);

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "Email already in use" }, 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { username, email, passwordHash } });

  return c.json(
    {
      user: { id: user.id, email: user.email, username: user.username },
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    },
    201
  );
}

export async function login(c: Context) {
  const body = await c.req.json();
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  return c.json({
    user: { id: user.id, email: user.email },
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  });
}

export async function refresh(c: Context) {
  const body = await c.req.json();
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(body);

  try {
    const { userId } = verifyRefreshToken(refreshToken);
    return c.json({ accessToken: signAccessToken(userId) });
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
}
