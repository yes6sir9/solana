import { clusterApiUrl } from "@solana/web3.js";

export const SOLANA_NETWORK = (import.meta.env.VITE_SOLANA_NETWORK as string) || "devnet";

export const SOLANA_RPC_URL =
  (import.meta.env.VITE_SOLANA_RPC_URL as string) || clusterApiUrl("devnet");

export const METADATA_BASE_URL =
  (import.meta.env.VITE_METADATA_STORAGE_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/api$/, "") ||
  "http://localhost:4000";
