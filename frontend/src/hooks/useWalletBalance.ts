import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/** Polls the connected wallet's SOL balance on devnet. */
export function useWalletBalance(intervalMs = 15000) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) setBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setBalance(null);
      }
    };

    fetchBalance();
    const id = setInterval(fetchBalance, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [connection, publicKey, intervalMs]);

  return balance;
}
