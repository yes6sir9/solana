import type { FC } from "react";
import { Link } from "react-router-dom";
import type { Pet } from "../types/pet";
import { RarityBadge } from "./RarityBadge";
import { StatBar } from "./StatBar";
import { PetViewer } from "./PetViewer";

export const PetCard: FC<{ pet: Pet }> = ({ pet }) => (
  <Link
    to={`/pets/${pet.id}`}
    className="glass rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20 transition-all group"
  >
    <div className="flex items-start justify-between">
      <PetViewer pet={pet} size={64} />
      <div className="flex flex-col items-end gap-1">
        <RarityBadge rarity={pet.rarity} />
        {pet.mintStatus === "MINTED" && (
          <span className="text-[10px] text-cyan-300 font-semibold">⛓ On-chain</span>
        )}
      </div>
    </div>

    <div>
      <h3 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">{pet.name}</h3>
      <p className="text-xs text-gray-400">
        {pet.type} · Level {pet.level}
      </p>
    </div>

    <div className="flex flex-col gap-2">
      <StatBar label="Hunger" value={pet.hunger} />
      <StatBar label="Happiness" value={pet.happiness} />
      <StatBar label="Energy" value={pet.energy} />
    </div>
  </Link>
);
