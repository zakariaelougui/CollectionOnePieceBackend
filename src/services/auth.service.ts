import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(userId: string) {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.sign({ userId }, secret, { expiresIn: "15m" });
}

export function signRefreshToken(userId: string) {
  const secret = process.env["JWT_REFRESH_SECRET"];
  if (!secret) throw new Error("JWT_REFRESH_SECRET not set");
  return jwt.sign({ userId }, secret, { expiresIn: "30d" });
}

export function verifyRefreshToken(token: string): { userId: string } {
  const secret = process.env["JWT_REFRESH_SECRET"];
  if (!secret) throw new Error("JWT_REFRESH_SECRET not set");
  return jwt.verify(token, secret) as { userId: string };
}
