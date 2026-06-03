/**
 * This file defines the authentication routes for the application,
 * including registration, login, and token refresh endpoints.
 * It uses the Hono framework to create a router and connects it to the corresponding handler functions for each route.
 */

import { Hono } from "hono";
import { login, refresh, register } from "../handlers/auth.js";

export const authRouter = new Hono();

authRouter.post("/register", register);

authRouter.post("/login", login);

authRouter.post("/refresh", refresh);
