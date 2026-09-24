import type { FC } from "react";
import { AURA_COLOR, AURA_EMOJI, PET_EMOJI, growthStageForLevel } from "../types/pet";
import type { Pet, PetPalette } from "../types/pet";

const ACCESSORY_EMOJI: Record<string, string> = {
  party_hat: "🎉",
  sunglasses: "🕶️",
  crown: "👑",
  bandana: "🧣",
};

/**
 * Renders a pet from its DNA: a procedurally-colored body blob (palette
 * primary/secondary from the generated color harmony), an aura glow ring
 * if one was rolled, and the species emoji sized by growth stage. This is
 * an honest MVP stand-in for true per-part sprite composition — see
 * README "MVP / mock" section for what a full asset pipeline would add.
 */
export const PetViewer: FC<{ pet: Pet; size?: number }> = ({ pet, size = 160 }) => {
  const palette: PetPalette = JSON.parse(pet.palette);
  const stage = growthStageForLevel(pet.level);
  const scale = { BABY: 0.75, YOUNG: 0.88, ADULT: 1, EVOLVED: 1.12 }[stage];
  const auraColor = pet.auraType ? AURA_COLOR[pet.auraType] : null;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {auraColor && (
        <div
          className="absolute inset-0 rounded-full animate-pulse-glow"
          style={{ boxShadow: `0 0 40px 10px ${auraColor}55`, border: `2px solid ${auraColor}88` }}
        />
      )}
      <div
        className="rounded-3xl flex items-center justify-center relative overflow-hidden"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 40% 35%, ${palette.secondary}33, ${palette.primary}22)`,
          border: `2px solid ${palette.outline}55`,
        }}
      >
        <span style={{ fontSize: size * 0.55 * scale, lineHeight: 1 }}>{PET_EMOJI[pet.type]}</span>
        {pet.equippedAccessoryKey && ACCESSORY_EMOJI[pet.equippedAccessoryKey] && (
          <span
            className="absolute"
            style={{ fontSize: size * 0.22, top: size * 0.04, right: size * 0.08 }}
          >
            {ACCESSORY_EMOJI[pet.equippedAccessoryKey]}
          </span>
        )}
        {pet.auraType && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs" title={`${pet.auraType} Aura`}>
            {AURA_EMOJI[pet.auraType]}
          </span>
        )}
      </div>
    </div>
  );
};
