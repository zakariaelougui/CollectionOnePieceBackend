import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { getAllCards, getCardById } from "../handlers/cards.js";

export const cardsRouter = new Hono();

// Gets all cards with optional filters (color, type, setId, search, page, limit) and pagination
cardsRouter.get("/", getAllCards);
// Gets a specific card by its ID
cardsRouter.get("/:id", getCardById);
