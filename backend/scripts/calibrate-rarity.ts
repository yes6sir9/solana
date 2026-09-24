import { deriveDnaFromSeedHash, hashSeed } from "../src/services/dnaService";

const scores: number[] = [];
for (let i = 0; i < 50000; i++) {
  const seedHash = hashSeed("calib-" + i);
  const d = deriveDnaFromSeedHash(seedHash);
  scores.push(d.traitScore);
}
scores.sort((a, b) => a - b);
const pct = (p: number) => scores[Math.floor(scores.length * p)];
console.log("min", scores[0], "max", scores[scores.length - 1]);
console.log("p60 (common cutoff)", pct(0.6));
console.log("p85 (uncommon cutoff)", pct(0.85));
console.log("p95 (rare cutoff)", pct(0.95));
console.log("p99 (epic cutoff)", pct(0.99));
console.log("p999 (legendary cutoff)", pct(0.999));
