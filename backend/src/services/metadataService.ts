import { getPetById } from "./petService";
import { PET_IMAGE, PetTypeKey } from "../constants/petData";
import { AURA_COLOR, AuraType } from "../constants/dna";
import type { Palette } from "./colorService";
import type { PetTraits } from "./dnaService";

/**
 * Builds Metaplex-standard off-chain NFT JSON metadata for a pet.
 *
 * This is served at GET /api/metadata/:petId and that URL is what gets
 * passed as the `uri` when minting the NFT (see frontend/src/services/nft.ts).
 * Static (image/DNA/rarity) fields live in the NFT metadata as usual;
 * mutable gameplay stats (level, xp, current stats) are duplicated here as
 * attributes for convenience/display, but the database — not the chain —
 * remains the source of truth for them, per the MVP design in the README.
 */
export async function buildPetMetadata(petId: string, appBaseUrl: string) {
  const pet = await getPetById(petId);
  const traits: PetTraits = JSON.parse(pet.traits);

  return {
    name: pet.name,
    symbol: "PETNFT",
    description: `${pet.name} is a ${pet.rarity} ${pet.archetype} companion in PetNFT — a Solana devnet GameFi MVP. DNA: ${pet.dnaHash.slice(0, 16)}...`,
    // Placeholder image: a procedurally-colored SVG stands in for real generated part-based art.
    image: `${appBaseUrl}/api/metadata/${petId}/image`,
    external_url: appBaseUrl,
    attributes: [
      { trait_type: "Species", value: pet.type },
      { trait_type: "Archetype", value: pet.archetype },
      { trait_type: "Rarity", value: pet.rarity },
      { trait_type: "Generation", value: pet.generation },
      { trait_type: "Aura", value: pet.auraType ?? "None" },
      { trait_type: "Pattern", value: traits.pattern },
      { trait_type: "Level", value: pet.level },
      { trait_type: "Strength", value: pet.strength },
      { trait_type: "Speed", value: pet.speed },
      { trait_type: "Luck", value: pet.luck },
      { trait_type: "Trait Score", value: pet.traitScore },
    ],
    properties: {
      category: "image",
      files: [{ uri: `${appBaseUrl}/api/metadata/${petId}/image`, type: "image/svg+xml" }],
    },
    // Custom, non-standard block: convenient for the PetNFT app to re-read,
    // ignored by generic NFT viewers.
    petnft: {
      petId: pet.id,
      dna: pet.dnaHash,
      archetype: pet.archetype,
      traits,
      rarity: pet.rarity,
      auraType: pet.auraType,
      level: pet.level,
      strength: pet.strength,
      speed: pet.speed,
      happiness: pet.happiness,
    },
  };
}

/**
 * Generates a stylized SVG "portrait" for a pet from its DNA — a
 * procedurally colored body blob (using the generated palette + pattern
 * accent), an aura glow ring if the pet rolled one, and the species emoji
 * on top. This is an honest MVP stand-in for true per-part sprite
 * rendering/masking (see README "MVP / mock" section) — colors, pattern
 * accent and aura are real and DNA-driven; the body silhouette itself is
 * not yet composed from individual part assets.
 */
export async function buildPetImageSvg(petId: string) {
  const pet = await getPetById(petId);
  const emoji = PET_IMAGE[pet.type as PetTypeKey];
  const palette: Palette = JSON.parse(pet.palette);
  const auraColor = pet.auraType ? AURA_COLOR[pet.auraType as AuraType] : null;

  const auraRing = auraColor
    ? `<circle cx="256" cy="256" r="230" fill="none" stroke="${auraColor}" stroke-width="14" opacity="0.55"/>
       <circle cx="256" cy="256" r="245" fill="none" stroke="${auraColor}" stroke-width="4" opacity="0.35"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <defs>
      <radialGradient id="bg" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="${palette.secondary}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0.12"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="${palette.primary}0d"/>
    <circle cx="256" cy="256" r="200" fill="url(#bg)"/>
    ${auraRing}
    <circle cx="256" cy="300" r="150" fill="${palette.primary}" opacity="0.25" stroke="${palette.outline}" stroke-width="3"/>
    <text x="50%" y="52%" font-size="240" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </svg>`;
}
