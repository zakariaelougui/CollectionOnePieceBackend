import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const secret = process.env["JWT_SECRET"];
    if (!secret) throw new Error("JWT_SECRET not set");
    const payload = jwt.verify(token, secret) as { userId: string };
    c.set("userId", payload.userId);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
