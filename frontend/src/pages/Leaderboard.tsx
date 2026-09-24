import { useEffect, useState } from "react";
import type { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { LeaderboardEntry } from "../types/user";
import { leaderboardApi } from "../services/api";
import { PET_EMOJI } from "../types/pet";
import type { PetType, Rarity } from "../types/pet";
import { RarityBadge } from "../components/RarityBadge";

export const Leaderboard: FC = () => {
  const { publicKey } = useWallet();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi
      .get()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  const wallet = publicKey?.toBase58();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Leaderboard</h1>

      {loading && <p className="text-gray-400 text-sm">Loading…</p>}

      {!loading && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase border-b border-white/10">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Pet</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">XP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.petId}
                  className={`border-b border-white/5 last:border-0 ${
                    entry.wallet === wallet ? "bg-purple-500/10" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-gray-300">
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{PET_EMOJI[entry.petType as PetType]}</span>
                      <span className="text-white font-medium">{entry.petName}</span>
                      <RarityBadge rarity={entry.rarity as Rarity} />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {entry.wallet.slice(0, 4)}…{entry.wallet.slice(-4)}
                  </td>
                  <td className="px-4 py-3 text-gray-200">{entry.level}</td>
                  <td className="px-4 py-3 text-gray-200">{entry.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <p className="text-gray-400 text-sm text-center py-10">No pets yet — be the first!</p>}
        </div>
      )}
    </div>
  );
};
