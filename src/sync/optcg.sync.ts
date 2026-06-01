import { prisma } from "../lib/prisma.js";

const BASE_URL = "https://optcgapi.com";

interface OPTCGCard {
  card_set_id?: string;
  card_name?: string;
  set_id?: string;
  card_type?: string;
  card_color?: string;
  card_cost?: string;
  card_power?: string;
  counter_amount?: number | null;
  rarity?: string;
  card_image?: string;
  attribute?: string;
  card_text?: string;
}

function toCardData(raw: OPTCGCard) {
  const id = raw.card_set_id;
  if (!id || !raw.card_name) return null;
  return {
    id,
    name: raw.card_name,
    setId: raw.set_id ?? null,
    type: raw.card_type ?? null,
    color: raw.card_color ?? null,
    cost: raw.card_cost ?? null,
    power: raw.card_power ?? null,
    counter: raw.counter_amount != null ? String(raw.counter_amount) : null,
    rarity: raw.rarity ?? null,
    imageUrl: raw.card_image ?? null,
    attribute: raw.attribute ?? null,
    effect: raw.card_text ?? null,
    cardType: raw.card_type ?? null,
  };
}

async function fetchAll(path: string): Promise<OPTCGCard[]> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`OPTCG API error: ${res.status} ${path}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function upsertCards(cards: OPTCGCard[]) {
  const records = cards.map(toCardData).filter(Boolean) as NonNullable<ReturnType<typeof toCardData>>[];
  for (const card of records) {
    await prisma.card.upsert({
      where: { id: card.id },
      create: card,
      update: card,
    });
  }
  return records.length;
}

async function syncEndpoint(path: string): Promise<number> {
  try {
    const cards = await fetchAll(path);
    return await upsertCards(cards);
  } catch (err) {
    console.warn(`[sync] Skipping ${path}: ${(err as Error).message}`);
    return 0;
  }
}

export async function runFullSync() {
  console.log("[sync] Starting full card sync from OPTCG API...");
  const results = await Promise.all([
    syncEndpoint("/api/allSetCards/"),
    syncEndpoint("/api/allSTCards/"),
    syncEndpoint("/api/allDonCards/"),
  ]);
  const total = results.reduce((a, b) => a + b, 0);
  console.log(`[sync] Full sync complete — ${total} cards upserted`);
}

// Re-uses the same full endpoints since no working incremental endpoints exist
export async function runIncrementalSync() {
  console.log("[sync] Running daily sync...");
  await runFullSync();
}
