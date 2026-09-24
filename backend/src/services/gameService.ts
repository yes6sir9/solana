import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { getOrCreateUser, awardPetCoins, addAccountXp } from "./userService";
import { applyGameReward, assertOwnership, getPetById } from "./petService";

export interface GameDefinition {
  key: string;
  name: string;
  description: string;
  maxScore: number;
}

// Only two of the brief's four mini-games are implemented end-to-end in
// this MVP (Reaction, Memory) — see README "MVP / mock" section for why
// Catch and Training-specific games are listed as next steps instead of
// faked with placeholder logic.
export const GAME_CATALOG: GameDefinition[] = [
  {
    key: "REACTION",
    name: "Reaction Game",
    description: "Tap the target the instant it lights up. Faster reactions score higher.",
    maxScore: 100,
  },
  {
    key: "MEMORY",
    name: "Memory Game",
    description: "Repeat the growing sequence of tiles from memory.",
    maxScore: 100,
  },
];

// Basic anti-farming: cap completions per wallet per hour. This is not a
// substitute for real anti-cheat (a determined client could still submit
// fabricated scores) — see README for the honest limitation.
const MAX_GAME_COMPLETIONS_PER_HOUR = 20;

export function getGameCatalog() {
  return GAME_CATALOG;
}

export async function completeGame(wallet: string, gameKey: string, rawScore: number, petId?: string) {
  const game = GAME_CATALOG.find((g) => g.key === gameKey);
  if (!game) throw new ApiError(404, `Unknown game "${gameKey}"`);

  await getOrCreateUser(wallet);

  const recentCount = await prisma.actionLog.count({
    where: { walletAddress: wallet, action: "GAME_COMPLETE", createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recentCount >= MAX_GAME_COMPLETIONS_PER_HOUR) {
    throw new ApiError(429, "Too many game sessions this hour — try again later");
  }

  const score = Math.max(0, Math.min(game.maxScore, Math.round(rawScore)));
  const xpAwarded = Math.round(score * 0.5);
  const coinsAwarded = Math.round(score * 0.3);

  await prisma.gameSession.create({
    data: { walletAddress: wallet, gameKey, score, xpAwarded, coinsAwarded },
  });
  await prisma.actionLog.create({ data: { walletAddress: wallet, action: "GAME_COMPLETE" } });
  await awardPetCoins(wallet, coinsAwarded);
  const accountXpResult = await addAccountXp(wallet, xpAwarded);

  let petResult = null;
  if (petId) {
    const pet = await getPetById(petId);
    assertOwnership(pet, wallet);
    petResult = await applyGameReward(pet, xpAwarded, Math.round(score * 0.05));
  }

  return { score, xpAwarded, coinsAwarded, accountLeveledUp: accountXpResult.leveledUp, pet: petResult };
}
