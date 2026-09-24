import { prisma } from "../db";

// ---- Tunable economy parameters (brief sections 3, 24) --------------------
export const BASE_PRICE_SOL = 0.1;
export const MIN_PRICE_SOL = 0.05;
export const MAX_PRICE_SOL = 2.0;

/** Purely an economy pressure knob, not a hard mint cap — see computePrice(). */
export const TOTAL_SUPPLY_SOFT_CAP = 100_000;
/** "Comfortable" mint velocity — price pressure ramps up past this. */
export const TARGET_MINTS_PER_HOUR = 10;

export const PRICE_RECOMPUTE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
/** EMA smoothing factor: how much weight the newest raw price gets. */
export const PRICE_EMA_ALPHA = 0.3;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export interface MintPriceQuote {
  priceSol: number;
  totalMinted: number;
  mintedLastHour: number;
  mintedLast24h: number;
  demandMultiplier: number;
  supplyMultiplier: number;
  computedAt: Date;
}

/**
 * Pure pricing formula — no I/O — so it can be unit tested in isolation
 * (see backend/tests/economy.test.ts) without touching the database.
 */
export function calculateMintPrice(totalMinted: number, mintedLastHour: number) {
  // Demand: mint velocity above the "comfortable" target pushes price up.
  const demandMultiplier = clamp(1 + (mintedLastHour / TARGET_MINTS_PER_HOUR) * 0.5, 0.5, 3);

  // Supply: as the soft cap fills up, remaining mints get pricier.
  const supplyMultiplier = clamp(1 + (totalMinted / TOTAL_SUPPLY_SOFT_CAP) * 1.0, 1, 2);

  const priceSol = clamp(BASE_PRICE_SOL * demandMultiplier * supplyMultiplier, MIN_PRICE_SOL, MAX_PRICE_SOL);

  return { priceSol, demandMultiplier, supplyMultiplier };
}

async function computeRawPrice(): Promise<Omit<MintPriceQuote, "computedAt">> {
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [totalMinted, mintedLastHour, mintedLast24h] = await Promise.all([
    prisma.pet.count(),
    prisma.pet.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.pet.count({ where: { createdAt: { gte: oneDayAgo } } }),
  ]);

  const { priceSol, demandMultiplier, supplyMultiplier } = calculateMintPrice(totalMinted, mintedLastHour);

  return { priceSol, totalMinted, mintedLastHour, mintedLast24h, demandMultiplier, supplyMultiplier };
}

/**
 * Returns the current mint price, recomputing (and persisting a new
 * EconomySnapshot) at most once per PRICE_RECOMPUTE_INTERVAL_MS. Between
 * recomputes, the same cached price is returned so it doesn't jump on
 * every single request — and even on recompute, the new price is EMA-
 * blended with the previous snapshot so it can't jump too sharply in one
 * step (brief section 24: "цена не должна изменяться после каждой
 * отдельной покупки слишком резко").
 */
export async function getCurrentMintPrice(): Promise<MintPriceQuote> {
  const latest = await prisma.economySnapshot.findFirst({ orderBy: { createdAt: "desc" } });

  if (latest && Date.now() - latest.createdAt.getTime() < PRICE_RECOMPUTE_INTERVAL_MS) {
    return {
      priceSol: latest.priceSol,
      totalMinted: latest.totalMinted,
      mintedLastHour: latest.mintedLastHour,
      mintedLast24h: latest.mintedLast24h,
      demandMultiplier: latest.demandMultiplier,
      supplyMultiplier: latest.supplyMultiplier,
      computedAt: latest.createdAt,
    };
  }

  const raw = await computeRawPrice();
  const smoothedPrice = latest
    ? clamp(
        PRICE_EMA_ALPHA * raw.priceSol + (1 - PRICE_EMA_ALPHA) * latest.priceSol,
        MIN_PRICE_SOL,
        MAX_PRICE_SOL
      )
    : raw.priceSol;

  const snapshot = await prisma.economySnapshot.create({
    data: { ...raw, priceSol: smoothedPrice },
  });

  return {
    priceSol: snapshot.priceSol,
    totalMinted: snapshot.totalMinted,
    mintedLastHour: snapshot.mintedLastHour,
    mintedLast24h: snapshot.mintedLast24h,
    demandMultiplier: snapshot.demandMultiplier,
    supplyMultiplier: snapshot.supplyMultiplier,
    computedAt: snapshot.createdAt,
  };
}
