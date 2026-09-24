import { createHash, randomBytes } from "crypto";
import { prisma } from "../db";
import {
  ARCHETYPE_OPTIONS,
  ARCHETYPE_SOCKETS,
  AURA_NONE_WEIGHT,
  AURA_TOTAL_WEIGHT,
  AURA_WEIGHTS,
  Archetype,
  AuraType,
  COLOR_HARMONIES,
  EARS,
  EYES,
  FINS,
  LEGS,
  MOUTHS,
  PATTERNS,
  RarityKey,
  SPECIALS,
  TAILS,
  WINGS,
  WeightedOption,
  rarityFromScore,
} from "../constants/dna";
import { generatePalette, Palette } from "./colorService";

export interface PetTraits {
  ears?: string;
  eyes?: string;
  mouth?: string;
  tail?: string;
  legs?: string;
  wings?: string;
  fins?: string;
  special?: string;
  pattern: string;
}

export interface BodyParams {
  width: number;
  height: number;
  size: number;
  headSize: number;
}

export interface PetDna {
  seedHash: string;
  dnaHash: string;
  archetype: Archetype;
  traits: PetTraits;
  bodyParams: BodyParams;
  palette: Palette;
  traitScore: number;
  rarity: RarityKey;
  auraType: AuraType | null;
}

/** sha256(seed) as a hex string — the seed itself is never persisted. */
export function hashSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

/**
 * Builds a fresh, safe generation seed. Per the brief, we NEVER touch the
 * user's real wallet private key or seed phrase — this combines the
 * wallet address (public info) with server-side randomness and a
 * timestamp, so it's unique per mint and unguessable in advance, while
 * still being fully reproducible from the resulting seedHash for audits.
 */
export function buildGenerationSeed(wallet: string, petName: string): string {
  return `${wallet}:${petName}:${Date.now()}:${randomBytes(16).toString("hex")}`;
}

/** Mulberry32 — small, fast, deterministic PRNG seeded from a 32-bit int. */
function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derives a stream of independent-enough 32-bit seeds from one hash. */
function seedStream(hashHex: string): () => number {
  // Walk the hex digest 8 chars (32 bits) at a time, wrapping around and
  // re-hashing once exhausted, so the stream never runs dry.
  let hex = hashHex;
  let offset = 0;
  const nextSeed = () => {
    if (offset + 8 > hex.length) {
      hex = createHash("sha256").update(hex).digest("hex");
      offset = 0;
    }
    const chunk = hex.slice(offset, offset + 8);
    offset += 8;
    return parseInt(chunk, 16);
  };
  let rng = mulberry32(nextSeed());
  let drawsOnThisRng = 0;
  return () => {
    // Re-seed periodically from the hash stream for extra decorrelation.
    if (drawsOnThisRng++ > 6) {
      rng = mulberry32(nextSeed());
      drawsOnThisRng = 0;
    }
    return rng();
  };
}

function weightedPick<T extends WeightedOption>(options: T[], rand: () => number): T {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let roll = rand() * total;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option;
  }
  return options[options.length - 1];
}

function range(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** Pure function: same seedHash always produces the exact same DNA. */
export function deriveDnaFromSeedHash(seedHash: string): Omit<PetDna, "seedHash" | "dnaHash"> {
  const rand = seedStream(seedHash);

  const archetypeOption = weightedPick(ARCHETYPE_OPTIONS, rand);
  const archetype = archetypeOption.id as Archetype;
  const sockets = ARCHETYPE_SOCKETS[archetype];

  let score = archetypeOption.rarityPoints;
  const traits: PetTraits = { pattern: "solid" };

  const pick = (pool: WeightedOption[]) => {
    const opt = weightedPick(pool, rand);
    score += opt.rarityPoints;
    return opt.id;
  };

  if (sockets.includes("ears")) traits.ears = pick(EARS);
  if (sockets.includes("eyes")) traits.eyes = pick(EYES);
  if (sockets.includes("mouth")) traits.mouth = pick(MOUTHS);
  if (sockets.includes("tail")) traits.tail = pick(TAILS);
  if (sockets.includes("legs")) traits.legs = pick(LEGS);
  if (sockets.includes("wings")) traits.wings = pick(WINGS);
  if (sockets.includes("fins")) traits.fins = pick(FINS);
  if (sockets.includes("special")) traits.special = pick(SPECIALS);
  traits.pattern = pick(PATTERNS);

  const bodyParams: BodyParams = {
    width: Number(range(rand, 0.8, 1.2).toFixed(3)),
    height: Number(range(rand, 0.8, 1.2).toFixed(3)),
    size: Number(range(rand, 0.8, 1.2).toFixed(3)),
    headSize: Number(range(rand, 0.8, 1.2).toFixed(3)),
  };

  const baseHue = Math.floor(range(rand, 0, 360));
  const harmony = COLOR_HARMONIES[Math.floor(rand() * COLOR_HARMONIES.length)];
  const saturation = range(rand, 40, 85);
  const value = range(rand, 40, 85);
  const palette = generatePalette(baseHue, harmony, saturation, value);

  // Aura roll — an independent, very-low-probability draw (brief 20-21).
  let auraRoll = rand() * AURA_TOTAL_WEIGHT;
  let auraType: AuraType | null = null;
  auraRoll -= AURA_NONE_WEIGHT;
  if (auraRoll > 0) {
    for (const [aura, weight] of Object.entries(AURA_WEIGHTS)) {
      auraRoll -= weight;
      if (auraRoll <= 0) {
        auraType = aura as AuraType;
        break;
      }
    }
  }
  if (auraType) score += 15;

  const rarity = rarityFromScore(score, auraType !== null);

  return { archetype, traits, bodyParams, palette, traitScore: score, rarity, auraType };
}

export function computeDnaHash(seedHash: string, derived: Omit<PetDna, "seedHash" | "dnaHash">): string {
  const payload = JSON.stringify({
    archetype: derived.archetype,
    traits: derived.traits,
    bodyParams: derived.bodyParams,
    palette: derived.palette,
    auraType: derived.auraType,
    seedHash,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Generates a full, deterministic pet DNA from a wallet+name, retrying
 * with a fresh seed on the astronomically unlikely event of a dnaHash
 * collision with an existing pet (the brief explicitly calls out that a
 * 256-bit hash alone isn't a *proof* of uniqueness — this closes the loop
 * with a real DB check rather than just asserting it can't happen).
 */
export async function generateUniquePetDna(wallet: string, petName: string): Promise<PetDna> {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const seed = buildGenerationSeed(wallet, petName);
    const seedHash = hashSeed(seed);
    const derived = deriveDnaFromSeedHash(seedHash);
    const dnaHash = computeDnaHash(seedHash, derived);

    const existing = await prisma.pet.findUnique({ where: { dnaHash } });
    if (!existing) {
      return { seedHash, dnaHash, ...derived };
    }
  }
  throw new Error("Failed to generate a unique pet DNA after multiple attempts");
}
