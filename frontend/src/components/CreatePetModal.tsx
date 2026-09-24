import { useEffect, useState } from "react";
import type { FC, FormEvent } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { RarityBadge } from "./RarityBadge";
import { PET_EMOJI, PET_TYPES } from "../types/pet";
import type { Pet, PetType } from "../types/pet";
import { economyApi, extractErrorMessage, petApi } from "../services/api";
import type { MintPriceQuote } from "../services/api";
import { payMintPrice } from "../services/mintPayment";
import { useGameData } from "../context/GameDataContext";
import { useToast } from "../context/ToastContext";

const COLORS = ["#8b5cf6", "#22d3ee", "#f472b6", "#f59e0b", "#22c55e", "#ef4444"];

type Stage = "form" | "paying" | "minting";

export const CreatePetModal: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { wallet: walletAddress, upsertPet } = useGameData();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [type, setType] = useState<PetType>("CAT");
  const [color, setColor] = useState(COLORS[0]);
  const [stage, setStage] = useState<Stage>("form");
  const [quote, setQuote] = useState<MintPriceQuote | null>(null);
  const [revealedPet, setRevealedPet] = useState<Pet | null>(null);

  useEffect(() => {
    if (open) economyApi.getMintPrice().then(setQuote).catch(() => setQuote(null));
  }, [open]);

  const submitting = stage !== "form";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !quote) return;
    if (!quote.treasuryWallet) {
      showToast("Treasury wallet is not configured on the backend (see .env.example)", "error");
      return;
    }

    try {
      setStage("paying");
      // 1) Pay the current dynamic mint price in SOL to the treasury —
      // the player approves this in Phantom.
      const signature = await payMintPrice(connection, wallet, quote.treasuryWallet, quote.priceSol);

      setStage("minting");
      // 2) The backend independently re-verifies that payment on-chain,
      // then generates the pet's DNA server-side and creates it.
      const result = await petApi.mint({
        ownerWallet: walletAddress,
        name,
        type,
        color,
        paymentTxSignature: signature,
      });
      upsertPet(result.pet);
      setRevealedPet(result.pet);
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setStage("form");
    }
  };

  const handleClose = () => {
    setName("");
    setRevealedPet(null);
    onClose();
  };

  if (revealedPet) {
    return (
      <Modal open={open} onClose={handleClose} title="A new pet appeared!">
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-7xl animate-level-up bg-white/5">
            {PET_EMOJI[revealedPet.type]}
          </div>
          <h3 className="text-xl font-bold text-white">{revealedPet.name}</h3>
          <div className="flex items-center gap-2">
            <RarityBadge rarity={revealedPet.rarity} />
            <span className="text-xs text-gray-400">{revealedPet.archetype}</span>
          </div>
          <p className="text-xs text-gray-500 font-mono break-all text-center">DNA {revealedPet.dnaHash}</p>
          {revealedPet.auraType && (
            <p className="text-xs text-amber-300">✨ Rolled a rare {revealedPet.auraType} Aura!</p>
          )}
          <p className="text-xs text-gray-400 text-center">
            Rarity comes from a Trait Score over the whole DNA combination — rolled server-side, verified unique.
          </p>
          <Button onClick={handleClose} className="w-full">
            Nice!
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Mint a Pet">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={32}
            placeholder="e.g. Blaze"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-2 block">Species</label>
          <div className="grid grid-cols-4 gap-2">
            {PET_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl p-3 text-center border transition-all ${
                  type === t ? "border-purple-400 bg-purple-500/20" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="text-2xl">{PET_EMOJI[t]}</div>
                <div className="text-[10px] mt-1 text-gray-300">{t}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-2 block">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-white" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          🧬 Archetype, body, colors, pattern and rarity are all generated deterministically from a fresh on-chain
          seed the moment you mint — Common is most likely, Mythic is a rare jackpot, and a hidden Elemental Aura is
          an extremely rare bonus.
        </p>

        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center justify-between text-sm">
          <span className="text-gray-400">Mint price</span>
          <span className="font-bold text-white">{quote ? `${quote.priceSol.toFixed(3)} SOL` : "…"}</span>
        </div>
        {quote && quote.mintedLastHour > 0 && (
          <p className="text-[11px] text-gray-500">
            Price adjusts dynamically with demand — {quote.mintedLastHour} minted in the last hour.
          </p>
        )}

        <Button type="submit" loading={submitting} disabled={!name.trim() || !quote}>
          {stage === "paying" ? "Confirm payment in wallet…" : stage === "minting" ? "Generating DNA…" : "Pay & Mint"}
        </Button>
      </form>
    </Modal>
  );
};
