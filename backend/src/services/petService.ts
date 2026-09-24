import { Pet } from "@prisma/client";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { getOrCreateUser } from "./userService";
import { assertMintAllowed } from "./antiAbuseService";
import { getCurrentMintPrice } from "./economyService";
import { generateUniquePetDna } from "./dnaService";
import { getTreasuryWallet, verifyAndConsumeMintPayment } from "./solanaVerifyService";
import { RARITY_MULTIPLIER, RarityKey } from "../constants/dna";
import { COOLDOWNS_MS, MAX_STAT, PET_BASE_STATS, PetTypeKey, levelFromXp, xpForLevel } from "../constants/petData";

const clamp = (value: number, min = 0, max = MAX_STAT) => Math.max(min, Math.min(max, value));

/** Allowed slippage between the quoted mint price and what was actually paid on-chain. */
const PRICE_SLIPPAGE_TOLERANCE = 0.05;

async function logAction(walletAddress: string, action: string) {
  await prisma.actionLog.create({ data: { walletAddress, action } });
}

export interface MintPetInput {
  ownerWallet: string;
  name: string;
  type: PetTypeKey;
  color?: string;
  /** Signature of the wallet's SOL transfer to the treasury, paying for this mint. */
  paymentTxSignature: string;
}

export interface MintPetResult {
  pet: Pet;
  pricePaidSol: number;
}

/**
 * The real "create a pet" entry point (brief: "создание питомца происходит
 * за определённое количество SOL"). Every critical check happens here, not
 * on the frontend:
 *  1. anti-bot rate limits (assertMintAllowed)
 *  2. the current dynamic mint price (getCurrentMintPrice)
 *  3. the on-chain payment is verified directly against Devnet and can't
 *     be replayed (verifyAndConsumeMintPayment)
 *  4. the pet's DNA is generated deterministically server-side and checked
 *     for uniqueness (generateUniquePetDna)
 *
 * This is distinct from `recordMint()` below, which records the *separate*
 * step of turning the already-created pet into an on-chain Metaplex NFT.
 */
export async function mintPet(input: MintPetInput): Promise<MintPetResult> {
  await getOrCreateUser(input.ownerWallet);
  await assertMintAllowed(input.ownerWallet);

  const quote = await getCurrentMintPrice();
  const minLamports = Math.floor(quote.priceSol * (1 - PRICE_SLIPPAGE_TOLERANCE) * LAMPORTS_PER_SOL);

  // Throws if the treasury isn't configured, the tx isn't found/confirmed,
  // doesn't pay the treasury enough, or has already been used.
  await verifyAndConsumeMintPayment(input.paymentTxSignature, input.ownerWallet, minLamports);

  const dna = await generateUniquePetDna(input.ownerWallet, input.name);

  const base = PET_BASE_STATS[input.type];
  const mult = RARITY_MULTIPLIER[dna.rarity as RarityKey];

  const pet = await prisma.pet.create({
    data: {
      ownerWallet: input.ownerWallet,
      name: input.name.trim().slice(0, 32),
      type: input.type,
      color: input.color ?? dna.palette.primary,
      rarity: dna.rarity,
      seedHash: dna.seedHash,
      dnaHash: dna.dnaHash,
      archetype: dna.archetype,
      traits: JSON.stringify(dna.traits),
      bodyParams: JSON.stringify(dna.bodyParams),
      palette: JSON.stringify(dna.palette),
      traitScore: dna.traitScore,
      auraType: dna.auraType,
      strength: Math.round(base.strength * mult),
      speed: Math.round(base.speed * mult),
      luck: Math.round(base.luck * mult),
    },
  });

  await prisma.transaction.create({
    data: {
      type: "MINT",
      petId: pet.id,
      walletAddress: input.ownerWallet,
      priceSol: quote.priceSol,
    },
  });

  return { pet, pricePaidSol: quote.priceSol };
}

export async function getPetsForWallet(ownerWallet: string) {
  return prisma.pet.findMany({ where: { ownerWallet }, orderBy: { createdAt: "desc" } });
}

export async function getPetById(id: string): Promise<Pet> {
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) throw new ApiError(404, "Pet not found");
  return pet;
}

export function assertOwnership(pet: Pet, wallet: string) {
  if (pet.ownerWallet !== wallet) {
    throw new ApiError(403, "You do not own this pet");
  }
}

function checkCooldown(last: Date | null, cooldownMs: number, label: string) {
  if (!last) return;
  const elapsed = Date.now() - last.getTime();
  if (elapsed < cooldownMs) {
    const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
    throw new ApiError(429, `${label} is on cooldown for ${remainingSec}s`);
  }
}

interface XpResult {
  pet: Pet;
  leveledUp: boolean;
  newLevel?: number;
}

/** Applies XP gain to a pet, handling multi-level level-ups and stat growth. */
async function applyXpAndSave(pet: Pet, data: Partial<Pet>, xpGain: number): Promise<XpResult> {
  const newXp = pet.xp + xpGain;
  const startLevel = pet.level;
  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > startLevel;

  const updateData: Partial<Pet> = { ...data, xp: newXp, level: newLevel };

  if (leveledUp) {
    const levelsGained = newLevel - startLevel;
    // Each level grants a small, deterministic stat boost and a full refill.
    updateData.strength = pet.strength + levelsGained * 2;
    updateData.speed = pet.speed + levelsGained * 2;
    updateData.health = MAX_STAT;
    updateData.energy = MAX_STAT;
  }

  const updated = await prisma.pet.update({ where: { id: pet.id }, data: updateData });
  if (leveledUp) await logAction(pet.ownerWallet, "LEVEL_UP");
  return { pet: updated, leveledUp, newLevel: leveledUp ? newLevel : undefined };
}

export async function feedPet(pet: Pet): Promise<XpResult> {
  checkCooldown(pet.lastFedAt, COOLDOWNS_MS.FEED, "Feed");
  const result = await applyXpAndSave(pet, { hunger: clamp(pet.hunger + 30), lastFedAt: new Date() }, 10);
  await logAction(pet.ownerWallet, "FEED");
  return result;
}

export async function playWithPet(pet: Pet): Promise<XpResult> {
  checkCooldown(pet.lastPlayedAt, COOLDOWNS_MS.PLAY, "Play");
  if (pet.energy < 10) throw new ApiError(400, "Pet is too tired to play — let it rest first");
  const result = await applyXpAndSave(
    pet,
    {
      happiness: clamp(pet.happiness + 20),
      energy: clamp(pet.energy - 10),
      lastPlayedAt: new Date(),
    },
    15
  );
  await logAction(pet.ownerWallet, "PLAY");
  return result;
}

export async function restPet(pet: Pet): Promise<Pet> {
  checkCooldown(pet.lastRestedAt, COOLDOWNS_MS.REST, "Rest");
  const updated = await prisma.pet.update({
    where: { id: pet.id },
    data: { energy: MAX_STAT, lastRestedAt: new Date() },
  });
  await logAction(pet.ownerWallet, "REST");
  return updated;
}

export type TrainableStat = "strength" | "speed";

export async function trainPet(pet: Pet, stat: TrainableStat): Promise<XpResult> {
  checkCooldown(pet.lastTrainedAt, COOLDOWNS_MS.TRAIN, "Train");
  const ENERGY_COST = 25;
  if (pet.energy < ENERGY_COST) {
    throw new ApiError(400, `Not enough Energy to train (needs ${ENERGY_COST})`);
  }
  const statGain = 3;
  const result = await applyXpAndSave(
    pet,
    {
      [stat]: pet[stat] + statGain,
      energy: clamp(pet.energy - ENERGY_COST),
      lastTrainedAt: new Date(),
    } as Partial<Pet>,
    20
  );
  await logAction(pet.ownerWallet, "TRAIN");
  return result;
}

/** Awards XP/stat gains from a mini-game session (called from gameService). */
export async function applyGameReward(pet: Pet, xpGain: number, luckGain: number): Promise<XpResult> {
  return applyXpAndSave(pet, { luck: pet.luck + luckGain }, xpGain);
}

export async function equipAccessory(pet: Pet, wallet: string, itemKey: string | null) {
  assertOwnership(pet, wallet);
  if (itemKey) {
    const entry = await prisma.inventoryItem.findFirst({
      where: { ownerWallet: wallet, item: { key: itemKey, category: "COSMETIC" }, quantity: { gt: 0 } },
    });
    if (!entry) throw new ApiError(400, "You don't own this accessory");
  }
  return prisma.pet.update({ where: { id: pet.id }, data: { equippedAccessoryKey: itemKey } });
}

/**
 * Records the result of a client-side (Phantom-signed) NFT mint against a
 * pet row. The backend never holds a private key and never submits the
 * mint transaction itself — it only persists the resulting mint address
 * once the frontend confirms the transaction landed on devnet. This is
 * the "turn my pet into an on-chain Metaplex NFT" step — separate from
 * mintPet() above, which is the paid pet-creation step.
 */
export async function recordMint(pet: Pet, wallet: string, mintAddress: string, metadataUri: string) {
  assertOwnership(pet, wallet);
  if (pet.mintStatus === "MINTED") {
    throw new ApiError(400, "Pet is already minted as an NFT");
  }
  return prisma.pet.update({
    where: { id: pet.id },
    data: { nftMintAddress: mintAddress, metadataUri, mintStatus: "MINTED" },
  });
}

export function nextLevelXp(pet: Pet) {
  return {
    currentLevelXp: xpForLevel(pet.level),
    nextLevelXp: xpForLevel(pet.level + 1),
  };
}

export { getTreasuryWallet };
