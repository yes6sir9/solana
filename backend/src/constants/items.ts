export interface ItemDefinition {
  key: string;
  name: string;
  description: string;
  category: "FOOD" | "TOY" | "POTION" | "TRAINING" | "COSMETIC";
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  icon: string;
}

export const ITEM_CATALOG: ItemDefinition[] = [
  {
    key: "kibble",
    name: "Basic Kibble",
    description: "Restores 15 Hunger instantly when used.",
    category: "FOOD",
    rarity: "COMMON",
    icon: "🍖",
  },
  {
    key: "premium_meal",
    name: "Premium Meal",
    description: "Restores 40 Hunger and a small amount of XP.",
    category: "FOOD",
    rarity: "RARE",
    icon: "🍱",
  },
  {
    key: "chew_toy",
    name: "Chew Toy",
    description: "Boosts Happiness by 20 when used.",
    category: "TOY",
    rarity: "COMMON",
    icon: "🧸",
  },
  {
    key: "energy_potion",
    name: "Energy Potion",
    description: "Instantly restores 30 Energy.",
    category: "POTION",
    rarity: "UNCOMMON",
    icon: "🧪",
  },
  {
    key: "health_potion",
    name: "Health Potion",
    description: "Restores 25 Health.",
    category: "POTION",
    rarity: "UNCOMMON",
    icon: "💊",
  },
  {
    key: "training_weights",
    name: "Training Weights",
    description: "Grants +2 Strength when used (no Energy cost).",
    category: "TRAINING",
    rarity: "RARE",
    icon: "🏋️",
  },
  {
    key: "speed_boots",
    name: "Speed Boots",
    description: "Grants +2 Speed when used (no Energy cost).",
    category: "TRAINING",
    rarity: "RARE",
    icon: "👟",
  },
  {
    key: "party_hat",
    name: "Party Hat",
    description: "An equippable cosmetic accessory. Purely for style.",
    category: "COSMETIC",
    rarity: "EPIC",
    icon: "🎉",
  },
  {
    key: "sunglasses",
    name: "Cool Shades",
    description: "An equippable cosmetic accessory. Purely for style.",
    category: "COSMETIC",
    rarity: "UNCOMMON",
    icon: "🕶️",
  },
  {
    key: "crown",
    name: "Golden Crown",
    description: "An equippable cosmetic accessory. Purely for style.",
    category: "COSMETIC",
    rarity: "LEGENDARY",
    icon: "👑",
  },
  {
    key: "bandana",
    name: "Bandana",
    description: "An equippable cosmetic accessory. Purely for style.",
    category: "COSMETIC",
    rarity: "COMMON",
    icon: "🧣",
  },
];

export const ACCESSORY_KEYS = ITEM_CATALOG.filter((i) => i.category === "COSMETIC").map((i) => i.key);

export const DAILY_REWARD_ITEM_POOL = ["kibble", "chew_toy", "energy_potion", "training_weights"];
