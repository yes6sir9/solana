import { describe, expect, it } from "vitest";
import { computeDnaHash, deriveDnaFromSeedHash, hashSeed } from "../src/services/dnaService";
import { RARITIES } from "../src/constants/dna";

describe("dnaService — deterministic generation", () => {
  it("produces the exact same DNA for the same seed hash every time", () => {
    const seedHash = hashSeed("wallet-abc:Blaze:1234567890:fixed-nonce");
    const a = deriveDnaFromSeedHash(seedHash);
    const b = deriveDnaFromSeedHash(seedHash);
    expect(a).toEqual(b);
    expect(computeDnaHash(seedHash, a)).toBe(computeDnaHash(seedHash, b));
  });

  it("produces different DNA for different seeds (checked over many samples)", () => {
    const hashes = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const seedHash = hashSeed(`wallet-${i}:Pet${i}:${i}`);
      const derived = deriveDnaFromSeedHash(seedHash);
      hashes.add(computeDnaHash(seedHash, derived));
    }
    // 200 distinct seeds should yield (essentially certainly) 200 distinct DNA hashes.
    expect(hashes.size).toBe(200);
  });

  it("only ever picks parts from the archetype's own compatible socket list", () => {
    for (let i = 0; i < 100; i++) {
      const seedHash = hashSeed(`socket-check-${i}`);
      const derived = deriveDnaFromSeedHash(seedHash);
      if (derived.archetype === "BIRD") {
        expect(derived.traits.wings).toBeDefined();
        expect(derived.traits.legs).toBeUndefined();
      }
      if (derived.archetype === "AQUATIC") {
        expect(derived.traits.fins).toBeDefined();
        expect(derived.traits.wings).toBeUndefined();
      }
    }
  });

  it("body params always land within the documented 0.8-1.2 range", () => {
    for (let i = 0; i < 50; i++) {
      const seedHash = hashSeed(`body-${i}`);
      const { bodyParams } = deriveDnaFromSeedHash(seedHash);
      for (const value of Object.values(bodyParams)) {
        expect(value).toBeGreaterThanOrEqual(0.8);
        expect(value).toBeLessThanOrEqual(1.2);
      }
    }
  });

  it("rarity distribution is weighted toward Common over a large sample (sanity, not exact %)", () => {
    const counts: Record<string, number> = Object.fromEntries(RARITIES.map((r) => [r, 0]));
    const SAMPLE = 3000;
    for (let i = 0; i < SAMPLE; i++) {
      const seedHash = hashSeed(`rarity-sample-${i}`);
      const { rarity } = deriveDnaFromSeedHash(seedHash);
      counts[rarity]++;
    }
    expect(counts.COMMON).toBeGreaterThan(counts.UNCOMMON);
    expect(counts.UNCOMMON).toBeGreaterThan(counts.RARE);
    expect(counts.RARE).toBeGreaterThan(counts.EPIC);
    // Mythic should be a rare jackpot, well under 5% of the sample.
    expect(counts.MYTHIC).toBeLessThan(SAMPLE * 0.05);
  });
});
