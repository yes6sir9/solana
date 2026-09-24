import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";

// Configurable wallet mint limits (brief section 4). In a real deployment
// these would live in an admin-editable config table; a plain object is
// enough for an MVP and keeps the knobs in one obvious place.
export const MINT_LIMITS = {
  perHour: 5,
  perDay: 20,
};

// After this many mints inside the short window below, force a cooldown
// before the wallet can mint again — catches rapid-fire bursts that would
// otherwise stay under the hourly cap.
export const BURST_LIMIT = {
  count: 3,
  windowMs: 10 * 60 * 1000, // 10 minutes
  cooldownMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Enforces per-wallet mint rate limits server-side. This can't be bypassed
 * by editing the frontend request — every check here runs against the
 * database's own record of past mints for the wallet, not anything the
 * client claims about itself.
 */
export async function assertMintAllowed(wallet: string): Promise<void> {
  const now = Date.now();
  const [countLastHour, countLastDay, countBurstWindow] = await Promise.all([
    prisma.pet.count({ where: { ownerWallet: wallet, createdAt: { gte: new Date(now - 60 * 60 * 1000) } } }),
    prisma.pet.count({ where: { ownerWallet: wallet, createdAt: { gte: new Date(now - 24 * 60 * 60 * 1000) } } }),
    prisma.pet.count({ where: { ownerWallet: wallet, createdAt: { gte: new Date(now - BURST_LIMIT.windowMs) } } }),
  ]);

  if (countBurstWindow >= BURST_LIMIT.count) {
    throw new ApiError(
      429,
      `Minting too fast — please wait a bit before creating another pet (burst cooldown: ${Math.round(
        BURST_LIMIT.cooldownMs / 60000
      )} min after ${BURST_LIMIT.count} mints in ${Math.round(BURST_LIMIT.windowMs / 60000)} min)`
    );
  }
  if (countLastHour >= MINT_LIMITS.perHour) {
    throw new ApiError(429, `Hourly mint limit reached (${MINT_LIMITS.perHour}/hour). Try again later.`);
  }
  if (countLastDay >= MINT_LIMITS.perDay) {
    throw new ApiError(429, `Daily mint limit reached (${MINT_LIMITS.perDay}/day). Try again tomorrow.`);
  }
}
