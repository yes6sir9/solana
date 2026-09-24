import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

/**
 * Builds, sends and confirms a plain SOL transfer from the connected
 * wallet to the treasury address for the given price — this is the
 * "pay to mint" transaction the player approves in Phantom. The backend
 * independently re-verifies this transaction on-chain before creating
 * the pet (see backend/src/services/solanaVerifyService.ts) — the
 * frontend's job here is only to construct and submit it, never to be
 * trusted as the source of truth for "was it paid".
 */
export async function payMintPrice(
  connection: Connection,
  wallet: WalletContextState,
  treasuryWallet: string,
  priceSol: number
): Promise<string> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error("Connect your wallet first");
  }

  const lamports = Math.ceil(priceSol * LAMPORTS_PER_SOL);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: new PublicKey(treasuryWallet),
      lamports,
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(transaction, connection);
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

  return signature;
}
