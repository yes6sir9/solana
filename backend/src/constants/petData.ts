// Rarity now lives in constants/dna.ts (6-tier, driven by Trait Score) —
// this file only keeps the flavor/species layer (CAT/DOG/FOX/DRAGON,
// independent of the procedural archetype) and the leveling/cooldown math.

export const PET_TYPES = ["CAT", "DOG", "FOX", "DRAGON"] as const;
export type PetTypeKey = (typeof PET_TYPES)[number];

// Base stat starting points per species — small flavour differences so
// species choice is not purely cosmetic.
export const PET_BASE_STATS: Record<PetTypeKey, { strength: number; speed: number; luck: number }> = {
  CAT: { strength: 8, speed: 14, luck: 12 },
  DOG: { strength: 12, speed: 10, luck: 8 },
  FOX: { strength: 9, speed: 13, luck: 14 },
  DRAGON: { strength: 15, speed: 8, luck: 6 },
};

// Emoji placeholders stand in for real art in this MVP — see README
// "MVP / mock" section. Swapping in real illustrations only requires
// changing this map.
export const PET_IMAGE: Record<PetTypeKey, string> = {
  CAT: "🐱",
  DOG: "🐶",
  FOX: "🦊",
  DRAGON: "🐉",
};

/**
 * XP required to REACH a given level (level 1 = 0 XP).
 * Levels 1-5 follow the fixed curve from the game design doc; levels 6+
 * extend it with a smooth, ever-increasing step so the curve keeps scaling
 * without needing a hand-authored table forever.
 */
const FIXED_THRESHOLDS = [0, 100, 250, 500, 850];

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= FIXED_THRESHOLDS.length) return FIXED_THRESHOLDS[level - 1];

  let xp = FIXED_THRESHOLDS[FIXED_THRESHOLDS.length - 1];
  let step = 350; // matches the level 4->5 gap (850-500=350) as the starting step
  for (let lvl = FIXED_THRESHOLDS.length + 1; lvl <= level; lvl++) {
    xp += step;
    step += 150;
  }
  return xp;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export const MAX_STAT = 100;

export const COOLDOWNS_MS = {
  FEED: 60 * 60 * 1000, // 1 hour
  PLAY: 30 * 60 * 1000, // 30 minutes
  REST: 45 * 60 * 1000, // 45 minutes
  TRAIN: 2 * 60 * 60 * 1000, // 2 hours
};
