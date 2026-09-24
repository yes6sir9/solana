// Trait catalogs for deterministic DNA-based pet generation.
//
// Every option carries a `rarityPoints` value used to compute a pet's
// overall Trait Score (see dnaService.ts) — rarity is a function of the
// WHOLE combination of choices, not any single field, per the design brief.
// Keep these lists small and curated (not exhaustive) — this is an MVP
// trait pool, easy to extend without touching the generation algorithm.

export const ARCHETYPES = ["ROUND", "QUADRUPED", "HUMANOID", "BIRD", "AQUATIC"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export interface WeightedOption {
  id: string;
  label: string;
  /** Selection weight — higher = more common. */
  weight: number;
  /** Contribution to Trait Score if picked — higher = rarer/more prestigious. */
  rarityPoints: number;
}

export const ARCHETYPE_OPTIONS: WeightedOption[] = [
  { id: "ROUND", label: "Round", weight: 35, rarityPoints: 0 },
  { id: "QUADRUPED", label: "Quadruped", weight: 30, rarityPoints: 0 },
  { id: "HUMANOID", label: "Humanoid", weight: 15, rarityPoints: 2 },
  { id: "BIRD", label: "Bird", weight: 12, rarityPoints: 2 },
  { id: "AQUATIC", label: "Aquatic", weight: 8, rarityPoints: 3 },
];

// Which trait categories apply to which archetype (drives socket/part
// compatibility per the brief's "sockets" concept — an archetype only
// ever gets parts from its own compatible pools below).
export const ARCHETYPE_SOCKETS: Record<Archetype, string[]> = {
  ROUND: ["ears", "eyes", "mouth", "tail", "pattern"],
  QUADRUPED: ["ears", "eyes", "mouth", "legs", "tail", "pattern"],
  HUMANOID: ["ears", "eyes", "mouth", "legs", "pattern", "special"],
  BIRD: ["eyes", "mouth", "wings", "tail", "pattern"],
  AQUATIC: ["eyes", "mouth", "fins", "tail", "pattern"],
};

export const EARS: WeightedOption[] = [
  { id: "round", label: "Round Ears", weight: 40, rarityPoints: 0 },
  { id: "pointed", label: "Pointed Ears", weight: 30, rarityPoints: 1 },
  { id: "floppy", label: "Floppy Ears", weight: 20, rarityPoints: 1 },
  { id: "tufted", label: "Tufted Ears", weight: 8, rarityPoints: 3 },
  { id: "none", label: "No Ears", weight: 2, rarityPoints: 4 },
];

export const EYES: WeightedOption[] = [
  { id: "round", label: "Round Eyes", weight: 40, rarityPoints: 0 },
  { id: "sharp", label: "Sharp Eyes", weight: 25, rarityPoints: 1 },
  { id: "sleepy", label: "Sleepy Eyes", weight: 20, rarityPoints: 1 },
  { id: "star", label: "Star Eyes", weight: 10, rarityPoints: 3 },
  { id: "heterochromia", label: "Heterochromia", weight: 5, rarityPoints: 5 },
];

export const MOUTHS: WeightedOption[] = [
  { id: "smile", label: "Smiling Mouth", weight: 40, rarityPoints: 0 },
  { id: "fang", label: "Fanged Mouth", weight: 25, rarityPoints: 1 },
  { id: "beak", label: "Beak", weight: 20, rarityPoints: 1 },
  { id: "small", label: "Small Mouth", weight: 10, rarityPoints: 1 },
  { id: "wide", label: "Wide Grin", weight: 5, rarityPoints: 3 },
];

export const TAILS: WeightedOption[] = [
  { id: "short", label: "Short Tail", weight: 35, rarityPoints: 0 },
  { id: "long", label: "Long Tail", weight: 30, rarityPoints: 1 },
  { id: "fluffy", label: "Fluffy Tail", weight: 20, rarityPoints: 2 },
  { id: "finned", label: "Finned Tail", weight: 10, rarityPoints: 2 },
  { id: "none", label: "No Tail", weight: 5, rarityPoints: 3 },
];

export const LEGS: WeightedOption[] = [
  { id: "paws", label: "Paws", weight: 45, rarityPoints: 0 },
  { id: "claws", label: "Claws", weight: 30, rarityPoints: 1 },
  { id: "hooves", label: "Hooves", weight: 20, rarityPoints: 2 },
  { id: "digitigrade", label: "Digitigrade Legs", weight: 5, rarityPoints: 4 },
];

export const WINGS: WeightedOption[] = [
  { id: "feathered", label: "Feathered Wings", weight: 60, rarityPoints: 1 },
  { id: "membrane", label: "Membrane Wings", weight: 30, rarityPoints: 2 },
  { id: "tiny", label: "Tiny Wings", weight: 10, rarityPoints: 3 },
];

export const FINS: WeightedOption[] = [
  { id: "smooth", label: "Smooth Fins", weight: 60, rarityPoints: 1 },
  { id: "spiked", label: "Spiked Fins", weight: 30, rarityPoints: 2 },
  { id: "frilled", label: "Frilled Fins", weight: 10, rarityPoints: 3 },
];

export const SPECIALS: WeightedOption[] = [
  { id: "none", label: "None", weight: 85, rarityPoints: 0 },
  { id: "third_eye", label: "Third Eye", weight: 5, rarityPoints: 8 },
  { id: "crystal_spikes", label: "Crystal Spikes", weight: 5, rarityPoints: 8 },
  { id: "glow_marks", label: "Glowing Marks", weight: 4, rarityPoints: 9 },
  { id: "extra_tail", label: "Extra Tail", weight: 1, rarityPoints: 12 },
];

export const PATTERNS: WeightedOption[] = [
  { id: "solid", label: "Solid", weight: 35, rarityPoints: 0 },
  { id: "spots", label: "Spots", weight: 22, rarityPoints: 1 },
  { id: "stripes", label: "Stripes", weight: 20, rarityPoints: 1 },
  { id: "gradient", label: "Gradient", weight: 12, rarityPoints: 2 },
  { id: "scales", label: "Scales", weight: 7, rarityPoints: 3 },
  { id: "geometric", label: "Geometric", weight: 4, rarityPoints: 4 },
];

export const COLOR_HARMONIES = ["analogous", "complementary", "triadic", "splitComplementary"] as const;
export type ColorHarmony = (typeof COLOR_HARMONIES)[number];

export const AURA_TYPES = [
  "FIRE",
  "WATER",
  "EARTH",
  "AIR",
  "LIGHTNING",
  "SHADOW",
  "LIGHT",
  "VOID",
] as const;
export type AuraType = (typeof AURA_TYPES)[number];

// Configurable aura weights out of AURA_TOTAL_WEIGHT. NONE dominates — auras
// are meant to be a very rare, purely cosmetic prestige feature (brief
// sections 20-21). Tune these constants to change drop rates.
export const AURA_TOTAL_WEIGHT = 1_000_000;
export const AURA_WEIGHTS: Record<AuraType, number> = {
  FIRE: 2000, // ~0.2% each — "common aura" tier
  WATER: 2000,
  EARTH: 2000,
  AIR: 2000,
  LIGHTNING: 800, // ~0.08% each — "rare aura" tier
  SHADOW: 800,
  LIGHT: 100, // ~0.01% each — "legendary aura" tier
  VOID: 100,
};
export const AURA_NONE_WEIGHT =
  AURA_TOTAL_WEIGHT - Object.values(AURA_WEIGHTS).reduce((a, b) => a + b, 0);

export const AURA_COLOR: Record<AuraType, string> = {
  FIRE: "#f97316",
  WATER: "#38bdf8",
  EARTH: "#84cc16",
  AIR: "#e5e7eb",
  LIGHTNING: "#facc15",
  SHADOW: "#7c3aed",
  LIGHT: "#fef9c3",
  VOID: "#0f172a",
};

export const RARITIES = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"] as const;
export type RarityKey = (typeof RARITIES)[number];

// Trait Score → final rarity tier. A pet's score is the sum of every
// picked option's `rarityPoints` (archetype + all body parts + pattern +
// special), boosted further if it rolled an elemental aura. These
// thresholds were empirically calibrated by sampling 50,000 generated
// pets (see backend/scripts/calibrate-rarity.ts) against the option
// weights above, landing close to the brief's target distribution
// (~60/25/10/4/0.9/0.1%). Re-run that script and update these values if
// the trait catalogs in this file change.
export const RARITY_SCORE_THRESHOLDS: { max: number; rarity: RarityKey }[] = [
  { max: 6, rarity: "COMMON" },
  { max: 9, rarity: "UNCOMMON" },
  { max: 12, rarity: "RARE" },
  { max: 18, rarity: "EPIC" },
  { max: 24, rarity: "LEGENDARY" },
  { max: Infinity, rarity: "MYTHIC" },
];

export function rarityFromScore(score: number, hasAura: boolean): RarityKey {
  const base = RARITY_SCORE_THRESHOLDS.find((t) => score <= t.max)!.rarity;
  if (!hasAura) return base;
  // An elemental aura is always at least Legendary-tier prestige.
  const auraFloorIndex = RARITY_SCORE_THRESHOLDS.findIndex((t) => t.rarity === "LEGENDARY");
  const baseIndex = RARITY_SCORE_THRESHOLDS.findIndex((t) => t.rarity === base);
  return RARITY_SCORE_THRESHOLDS[Math.max(baseIndex, auraFloorIndex)].rarity;
}

export const RARITY_COLOR: Record<RarityKey, string> = {
  COMMON: "#9ca3af",
  UNCOMMON: "#22c55e",
  RARE: "#3b82f6",
  EPIC: "#a855f7",
  LEGENDARY: "#f59e0b",
  MYTHIC: "#ef4444",
};

// Rarity still gives a starting-stat multiplier (on top of Trait Score
// driving which tier a pet lands in).
export const RARITY_MULTIPLIER: Record<RarityKey, number> = {
  COMMON: 1,
  UNCOMMON: 1.12,
  RARE: 1.28,
  EPIC: 1.5,
  LEGENDARY: 1.8,
  MYTHIC: 2.3,
};

export const GROWTH_STAGES = ["BABY", "YOUNG", "ADULT", "EVOLVED"] as const;
export type GrowthStage = (typeof GROWTH_STAGES)[number];

export function growthStageForLevel(level: number): GrowthStage {
  if (level < 5) return "BABY";
  if (level < 15) return "YOUNG";
  if (level < 30) return "ADULT";
  return "EVOLVED";
}
