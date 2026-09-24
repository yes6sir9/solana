import { useCallback, useRef, useState } from "react";
import type { FC } from "react";
import { Button } from "../Button";

type Phase = "idle" | "waiting" | "ready" | "tooSoon" | "done";

/**
 * Reaction Game: wait for the target to turn green, then click as fast as
 * possible. Score = 100 - (reactionMs / 10), clamped to [0, 100] — a
 * ~200ms reaction scores ~80, a ~1000ms+ reaction scores near 0. Clicking
 * before the target turns green scores 0 (brief section 16 "Reaction Game").
 */
export const ReactionGame: FC<{ onFinish: (score: number) => void }> = ({ onFinish }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const readyAtRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setReactionMs(null);
    setPhase("waiting");
    const delay = 1000 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      readyAtRef.current = performance.now();
      setPhase("ready");
    }, delay);
  }, []);

  const handleClick = () => {
    if (phase === "waiting") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase("tooSoon");
      onFinish(0);
      return;
    }
    if (phase === "ready") {
      const ms = performance.now() - readyAtRef.current;
      setReactionMs(ms);
      setPhase("done");
      const score = Math.max(0, Math.min(100, 100 - ms / 10));
      onFinish(Math.round(score));
    }
  };

  const colors: Record<Phase, string> = {
    idle: "bg-white/5 border-white/10 text-gray-400",
    waiting: "bg-red-500/20 border-red-400/40 text-red-200",
    ready: "bg-emerald-500/30 border-emerald-400/60 text-emerald-100",
    tooSoon: "bg-red-500/30 border-red-400/60 text-red-100",
    done: "bg-purple-500/20 border-purple-400/40 text-purple-100",
  };

  const labels: Record<Phase, string> = {
    idle: "Click Start",
    waiting: "Wait for green…",
    ready: "CLICK NOW!",
    tooSoon: "Too soon! Score: 0",
    done: reactionMs !== null ? `${Math.round(reactionMs)}ms — nice!` : "",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={phase === "waiting" || phase === "ready" ? handleClick : start}
        className={`w-full h-48 rounded-2xl border-2 flex items-center justify-center text-lg font-bold transition-colors ${colors[phase]}`}
      >
        {labels[phase] || "Click Start"}
      </button>
      {(phase === "idle" || phase === "tooSoon" || phase === "done") && (
        <Button onClick={start}>{phase === "idle" ? "Start" : "Play Again"}</Button>
      )}
    </div>
  );
};
