import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const TREASURY_WALLET = process.env.TREASURY_WALLET;

let connection: Connection | null = null;
function getConnection(): Connection {
  if (!connection) connection = new Connection(SOLANA_RPC_URL, "confirmed");
  return connection;
}

export function getTreasuryWallet(): string {
  if (!TREASURY_WALLET) {
    throw new ApiError(
      500,
      "TREASURY_WALLET is not configured on the backend — set it in backend/.env (see .env.example)"
    );
  }
  return TREASURY_WALLET;
}

/**
 * Verifies, directly against Solana Devnet, that `signature` is a
 * confirmed transaction paying at least `minLamports` from `payerWallet`
 * to the treasury wallet — then records the signature so it can never be
 * reused for a second mint (replay protection). This is the real
 * trust boundary for "did the player actually pay": the backend does not
 * take the frontend's word for it, it reads the chain itself.
 */
export async function verifyAndConsumeMintPayment(
  signature: string,
  payerWallet: string,
  minLamports: number
): Promise<void> {
  const existing = await prisma.mintPayment.findUnique({ where: { signature } });
  if (existing) {
    throw new ApiError(409, "This payment transaction has already been used for a mint");
  }

  const conn = getConnection();
  const tx = await conn.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
  if (!tx) {
    throw new ApiError(400, "Payment transaction not found on devnet (not confirmed yet, or invalid signature)");
  }
  if (tx.meta?.err) {
    throw new ApiError(400, "Payment transaction failed on-chain");
  }

  const treasury = getTreasuryWallet();
  const accountKeys = tx.transaction.message.getAccountKeys().staticAccountKeys.map((k) => k.toBase58());

  const payerIndex = accountKeys.indexOf(payerWallet);
  const treasuryIndex = accountKeys.indexOf(treasury);

  if (payerIndex === -1 || treasuryIndex === -1 || !tx.meta) {
    throw new ApiError(400, "Payment transaction does not involve the expected payer and treasury accounts");
  }

  const treasuryDelta = tx.meta.postBalances[treasuryIndex] - tx.meta.preBalances[treasuryIndex];
  const payerDelta = tx.meta.preBalances[payerIndex] - tx.meta.postBalances[payerIndex];

  if (treasuryDelta < minLamports || payerDelta < minLamports) {
    throw new ApiError(
      400,
      `Payment amount too low: paid ${treasuryDelta / LAMPORTS_PER_SOL} SOL, required at least ${
        minLamports / LAMPORTS_PER_SOL
      } SOL`
    );
  }

  await prisma.mintPayment.create({
    data: { signature, walletAddress: payerWallet, lamports: treasuryDelta },
  });
}

export function isValidPublicKey(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}
