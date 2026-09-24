import { prisma } from "../db";

/** Fetches the user for a wallet, creating a fresh account on first sight. */
export async function getOrCreateUser(walletAddress: string) {
  const existing = await prisma.user.findUnique({ where: { walletAddress } });
  if (existing) return existing;
  return prisma.user.create({ data: { walletAddress } });
}

export async function getUserProfile(walletAddress: string) {
  const user = await getOrCreateUser(walletAddress);

  const [pets, inventory, mintedCount] = await Promise.all([
    prisma.pet.findMany({ where: { ownerWallet: walletAddress }, orderBy: { createdAt: "desc" } }),
    prisma.inventoryItem.findMany({
      where: { ownerWallet: walletAddress, quantity: { gt: 0 } },
      include: { item: true },
    }),
    prisma.pet.count({ where: { ownerWallet: walletAddress, mintStatus: "MINTED" } }),
  ]);

  return { user, pets, inventory, petCount: pets.length, nftCount: mintedCount };
}

export async function awardPetCoins(walletAddress: string, amount: number) {
  await getOrCreateUser(walletAddress);
  return prisma.user.update({
    where: { walletAddress },
    data: { petCoins: { increment: amount } },
  });
}

/** Adds XP to the account level and returns whether the account leveled up. */
export async function addAccountXp(walletAddress: string, amount: number) {
  const user = await getOrCreateUser(walletAddress);
  const newXp = user.accountXp + amount;
  // simple flat curve for the account level: 200 xp per level
  const newLevel = Math.floor(newXp / 200) + 1;
  const leveledUp = newLevel > user.accountLevel;
  await prisma.user.update({
    where: { walletAddress },
    data: { accountXp: newXp, accountLevel: newLevel },
  });
  return { leveledUp, newLevel };
}
