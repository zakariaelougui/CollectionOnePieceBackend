import { Hono } from "hono";
import { login, refresh, register } from "../handlers/auth.js";

export const authRouter = new Hono();

authRouter.post("/register", register);

authRouter.post("/login", login);

authRouter.post("/refresh", refresh);
