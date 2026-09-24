import type { FC } from "react";
import { RARITY_COLOR } from "../types/pet";
import type { Rarity } from "../types/pet";

export const RarityBadge: FC<{ rarity: Rarity; className?: string }> = ({ rarity, className = "" }) => (
  <span
    className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${className}`}
    style={{
      color: RARITY_COLOR[rarity],
      borderColor: `${RARITY_COLOR[rarity]}55`,
      background: `${RARITY_COLOR[rarity]}15`,
    }}
  >
    {rarity}
  </span>
);
