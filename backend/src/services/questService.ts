import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { getOrCreateUser, awardPetCoins, addAccountXp } from "./userService";
import { grantItem } from "./inventoryService";

type QuestType = "DAILY" | "WEEKLY" | "ACHIEVEMENT";

export interface QuestDefinition {
  key: string;
  name: string;
  description: string;
  type: QuestType;
  target: number;
  reward: { xp: number; petCoins: number; itemKey?: string };
  /** Counts current progress toward `target` for a wallet, in the current period. */
  progress: (wallet: string, periodStart: Date) => Promise<number>;
}

async function countActions(wallet: string, action: string, since: Date) {
  return prisma.actionLog.count({ where: { walletAddress: wallet, action, createdAt: { gte: since } } });
}

export const QUEST_CATALOG: QuestDefinition[] = [
  {
    key: "daily_feed_3",
    name: "Caring Owner",
    description: "Feed your pet 3 times today.",
    type: "DAILY",
    target: 3,
    reward: { xp: 20, petCoins: 15 },
    progress: (wallet, since) => countActions(wallet, "FEED", since),
  },
  {
    key: "daily_play_2",
    name: "Playtime",
    description: "Play with your pet 2 times today.",
    type: "DAILY",
    target: 2,
    reward: { xp: 20, petCoins: 15 },
    progress: (wallet, since) => countActions(wallet, "PLAY", since),
  },
  {
    key: "daily_games_2",
    name: "Game On",
    description: "Complete 2 mini-games today.",
    type: "DAILY",
    target: 2,
    reward: { xp: 25, petCoins: 20, itemKey: "kibble" },
    progress: (wallet, since) => countActions(wallet, "GAME_COMPLETE", since),
  },
  {
    key: "weekly_level_up",
    name: "Growing Stronger",
    description: "Level up any pet this week.",
    type: "WEEKLY",
    target: 1,
    reward: { xp: 60, petCoins: 50 },
    progress: (wallet, since) => countActions(wallet, "LEVEL_UP", since),
  },
  {
    key: "achievement_level_5",
    name: "Rising Star",
    description: "Reach Level 5 with any pet.",
    type: "ACHIEVEMENT",
    target: 1,
    reward: { xp: 100, petCoins: 100 },
    progress: async (wallet) => {
      const count = await prisma.pet.count({ where: { ownerWallet: wallet, level: { gte: 5 } } });
      return count > 0 ? 1 : 0;
    },
  },
  {
    key: "achievement_rare_pet",
    name: "Rare Find",
    description: "Own a pet of Rare rarity or higher.",
    type: "ACHIEVEMENT",
    target: 1,
    reward: { xp: 80, petCoins: 80 },
    progress: async (wallet) => {
      const count = await prisma.pet.count({
        where: { ownerWallet: wallet, rarity: { in: ["RARE", "EPIC", "LEGENDARY", "MYTHIC"] } },
      });
      return count > 0 ? 1 : 0;
    },
  },
];

function todayUtcStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function weekUtcStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sunday
  const diff = (day + 6) % 7; // days since Monday
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return start;
}

function periodKey(quest: QuestDefinition): { periodStart: Date; dayKey: string } {
  if (quest.type === "DAILY") {
    const start = todayUtcStart();
    return { periodStart: start, dayKey: start.toISOString().slice(0, 10) };
  }
  if (quest.type === "WEEKLY") {
    const start = weekUtcStart();
    return { periodStart: start, dayKey: `week-${start.toISOString().slice(0, 10)}` };
  }
  return { periodStart: new Date(0), dayKey: "ALL" };
}

export async function getQuestsForWallet(wallet: string) {
  await getOrCreateUser(wallet);

  const results = [];
  for (const quest of QUEST_CATALOG) {
    const { periodStart, dayKey } = periodKey(quest);
    const [current, claim] = await Promise.all([
      quest.progress(wallet, periodStart),
      prisma.questClaim.findUnique({
        where: { walletAddress_questKey_dayKey: { walletAddress: wallet, questKey: quest.key, dayKey } },
      }),
    ]);

    results.push({
      key: quest.key,
      name: quest.name,
      description: quest.description,
      type: quest.type,
      target: quest.target,
      progress: Math.min(current, quest.target),
      reward: quest.reward,
      claimed: !!claim,
      canClaim: current >= quest.target && !claim,
    });
  }
  return results;
}

export async function completeQuest(wallet: string, questKey: string) {
  const quest = QUEST_CATALOG.find((q) => q.key === questKey);
  if (!quest) throw new ApiError(404, `Unknown quest "${questKey}"`);

  const { periodStart, dayKey } = periodKey(quest);
  const [current, existingClaim] = await Promise.all([
    quest.progress(wallet, periodStart),
    prisma.questClaim.findUnique({
      where: { walletAddress_questKey_dayKey: { walletAddress: wallet, questKey: quest.key, dayKey } },
    }),
  ]);

  if (existingClaim) throw new ApiError(409, "Quest already claimed for this period");
  if (current < quest.target) throw new ApiError(400, "Quest requirements not met yet");

  await prisma.questClaim.create({ data: { walletAddress: wallet, questKey: quest.key, dayKey } });
  await awardPetCoins(wallet, quest.reward.petCoins);
  const { leveledUp, newLevel } = await addAccountXp(wallet, quest.reward.xp);
  if (quest.reward.itemKey) await grantItem(wallet, quest.reward.itemKey, 1);

  return { quest: quest.key, reward: quest.reward, accountLeveledUp: leveledUp, newAccountLevel: newLevel };
}
