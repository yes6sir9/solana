import type { FC } from "react";

const COLORS: Record<string, string> = {
  Health: "#ef4444",
  Hunger: "#f59e0b",
  Happiness: "#ec4899",
  Energy: "#22d3ee",
  Strength: "#8b5cf6",
  Speed: "#22c55e",
};

export const StatBar: FC<{ label: string; value: number; max?: number }> = ({ label, value, max = 100 }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = COLORS[label] ?? "#8b5cf6";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-200 font-medium">
          {value}
          {max === 100 ? "" : ` / ${max}`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
};
