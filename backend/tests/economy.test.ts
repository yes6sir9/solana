import { describe, expect, it } from "vitest";
import { calculateMintPrice, MIN_PRICE_SOL, MAX_PRICE_SOL, BASE_PRICE_SOL } from "../src/services/economyService";

describe("economyService — dynamic mint pricing", () => {
  it("never returns a price outside [MIN_PRICE_SOL, MAX_PRICE_SOL]", () => {
    const scenarios: [number, number][] = [
      [0, 0],
      [50, 500],
      [1_000_000, 10_000],
      [10, 1],
    ];
    for (const [totalMinted, mintedLastHour] of scenarios) {
      const { priceSol } = calculateMintPrice(totalMinted, mintedLastHour);
      expect(priceSol).toBeGreaterThanOrEqual(MIN_PRICE_SOL);
      expect(priceSol).toBeLessThanOrEqual(MAX_PRICE_SOL);
    }
  });

  it("equals roughly the base price under low demand and low supply", () => {
    const { priceSol } = calculateMintPrice(0, 0);
    expect(priceSol).toBeCloseTo(BASE_PRICE_SOL, 5);
  });

  it("increases (or stays flat at the cap) as hourly mint velocity rises", () => {
    const low = calculateMintPrice(100, 1);
    const high = calculateMintPrice(100, 50);
    expect(high.priceSol).toBeGreaterThanOrEqual(low.priceSol);
  });

  it("increases (or stays flat at the cap) as total supply minted rises", () => {
    const low = calculateMintPrice(10, 0);
    const high = calculateMintPrice(90_000, 0);
    expect(high.priceSol).toBeGreaterThanOrEqual(low.priceSol);
  });

  it("is a pure function — same inputs always produce the same price", () => {
    const a = calculateMintPrice(42, 7);
    const b = calculateMintPrice(42, 7);
    expect(a).toEqual(b);
  });
});
