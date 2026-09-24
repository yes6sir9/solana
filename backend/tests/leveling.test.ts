import { describe, expect, it } from "vitest";
import { levelFromXp, xpForLevel } from "../src/constants/petData";

describe("leveling curve", () => {
  it("matches the fixed design-doc thresholds for levels 1-5", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(250);
    expect(xpForLevel(4)).toBe(500);
    expect(xpForLevel(5)).toBe(850);
  });

  it("keeps increasing the required XP step for every level beyond 5", () => {
    let prevThreshold = xpForLevel(5);
    let prevStep = Infinity;
    for (let level = 6; level <= 30; level++) {
      const threshold = xpForLevel(level);
      const step = threshold - prevThreshold;
      expect(threshold).toBeGreaterThan(prevThreshold);
      expect(step).toBeGreaterThan(0);
      prevThreshold = threshold;
      prevStep = step;
    }
    expect(prevStep).toBeGreaterThan(0);
  });

  it("levelFromXp is the exact inverse of xpForLevel at each threshold", () => {
    for (let level = 1; level <= 20; level++) {
      expect(levelFromXp(xpForLevel(level))).toBe(level);
    }
  });

  it("levelFromXp never overshoots — one XP short of a threshold stays at the lower level", () => {
    for (let level = 2; level <= 20; level++) {
      expect(levelFromXp(xpForLevel(level) - 1)).toBe(level - 1);
    }
  });
});
