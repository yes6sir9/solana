import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { getOrCreateUser, addAccountXp } from "./userService";
import { grantItem } from "./inventoryService";
import { DAILY_REWARD_ITEM_POOL } from "../constants/items";

const CLAIM_INTERVAL_MS = 24 * 60 * 60 * 1000;
const XP_REWARD = 25;
const PETCOIN_REWARD = 20;

export async function getDailyRewardStatus(walletAddress: string) {
  await getOrCreateUser(walletAddress);
  const last = await prisma.dailyRewardClaim.findFirst({
    where: { walletAddress },
    orderBy: { claimedAt: "desc" },
  });
  if (!last) return { canClaim: true, nextAvailableAt: null };

  const nextAvailableAt = new Date(last.claimedAt.getTime() + CLAIM_INTERVAL_MS);
  return { canClaim: Date.now() >= nextAvailableAt.getTime(), nextAvailableAt };
}

export async function claimDailyReward(walletAddress: string) {
  const status = await getDailyRewardStatus(walletAddress);
  if (!status.canClaim) {
    throw new ApiError(429, "Daily reward already claimed — come back later");
  }

  const itemKey = DAILY_REWARD_ITEM_POOL[Math.floor(Math.random() * DAILY_REWARD_ITEM_POOL.length)];

  await grantItem(walletAddress, itemKey, 1);
  await prisma.user.update({
    where: { walletAddress },
    data: { petCoins: { increment: PETCOIN_REWARD } },
  });
  const { leveledUp, newLevel } = await addAccountXp(walletAddress, XP_REWARD);

  const claim = await prisma.dailyRewardClaim.create({
    data: {
      walletAddress,
      xpAwarded: XP_REWARD,
      petCoinsAwarded: PETCOIN_REWARD,
      itemKeyAwarded: itemKey,
    },
  });

  return { claim, itemKey, leveledUp, newAccountLevel: newLevel };
}
