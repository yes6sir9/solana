import { useMemo } from "react";
import type { FC, ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SOLANA_RPC_URL } from "../services/solanaConfig";

import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * No explicit adapter list is passed here — modern wallets (Phantom,
 * Solflare, Backpack, ...) register themselves automatically via the
 * Wallet Standard, and @solana/wallet-adapter-react picks them up. This
 * also avoids pulling in the heavier @solana/wallet-adapter-wallets
 * package (which transitively drags in React Native for mobile adapters
 * and is unnecessary for a browser-only MVP).
 */
export const SolanaProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
