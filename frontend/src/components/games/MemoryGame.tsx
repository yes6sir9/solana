import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { Button } from "../Button";

const TILE_COLORS = ["#8b5cf6", "#22d3ee", "#f472b6", "#f59e0b"];

type Phase = "idle" | "showing" | "input" | "gameover";

/**
 * Memory Game: watch a growing sequence of tile flashes, then repeat it.
 * Each correctly completed round extends the sequence by one. Score =
 * rounds cleared * 12.5, capped at 100 (brief section 16 "Memory Game").
 */
export const MemoryGame: FC<{ onFinish: (score: number) => void }> = ({ onFinish }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [litTile, setLitTile] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const playSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    seq.forEach((tile, i) => {
      timeoutsRef.current.push(
        setTimeout(() => setLitTile(tile), i * 700)
      );
      timeoutsRef.current.push(
        setTimeout(() => setLitTile(null), i * 700 + 400)
      );
    });
    timeoutsRef.current.push(
      setTimeout(() => {
        setPlayerIndex(0);
        setPhase("input");
      }, seq.length * 700)
    );
  }, []);

  const start = () => {
    clearTimeouts();
    const first = [Math.floor(Math.random() * TILE_COLORS.length)];
    setSequence(first);
    setRound(0);
    playSequence(first);
  };

  const handleTileClick = (tile: number) => {
    if (phase !== "input") return;
    if (tile !== sequence[playerIndex]) {
      clearTimeouts();
      setPhase("gameover");
      const score = Math.min(100, round * 12.5);
      onFinish(Math.round(score));
      return;
    }
    const nextIndex = playerIndex + 1;
    if (nextIndex === sequence.length) {
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= 8) {
        setPhase("gameover");
        onFinish(100);
        return;
      }
      const next = [...sequence, Math.floor(Math.random() * TILE_COLORS.length)];
      setSequence(next);
      setTimeout(() => playSequence(next), 600);
    } else {
      setPlayerIndex(nextIndex);
    }
  };

  useEffect(() => clearTimeouts, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-400">
        {phase === "idle" && "Watch the sequence, then repeat it."}
        {phase === "showing" && "Watch closely…"}
        {phase === "input" && `Your turn — round ${round + 1}`}
        {phase === "gameover" && `Game over — cleared ${round} round${round === 1 ? "" : "s"}`}
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {TILE_COLORS.map((color, i) => (
          <button
            key={i}
            onClick={() => handleTileClick(i)}
            disabled={phase !== "input"}
            className="h-24 rounded-2xl border-2 transition-all disabled:cursor-not-allowed"
            style={{
              background: litTile === i ? color : `${color}22`,
              borderColor: litTile === i ? color : `${color}44`,
            }}
          />
        ))}
      </div>
      {(phase === "idle" || phase === "gameover") && (
        <Button onClick={start}>{phase === "idle" ? "Start" : "Play Again"}</Button>
      )}
    </div>
  );
};
