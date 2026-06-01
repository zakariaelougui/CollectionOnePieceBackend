import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/auth.service.js";

export const authRouter = new Hono();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "Email already in use" }, 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  return c.json(
    {
      user: { id: user.id, email: user.email },
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    },
    201
  );
});

authRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
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
});

authRouter.post("/refresh", async (c) => {
  const body = await c.req.json();
  const { refreshToken } = z
    .object({ refreshToken: z.string() })
    .parse(body);

  try {
    const { userId } = verifyRefreshToken(refreshToken);
    return c.json({ accessToken: signAccessToken(userId) });
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
});
