import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { getCurrentMintPrice } from "../services/economyService";
import { getTreasuryWallet } from "../services/solanaVerifyService";

export const getMintPrice = asyncHandler(async (_req: Request, res: Response) => {
  const quote = await getCurrentMintPrice();
  let treasuryWallet: string | null = null;
  try {
    treasuryWallet = getTreasuryWallet();
  } catch {
    treasuryWallet = null; // surfaced as null so the frontend can show a clear setup error
  }
  res.json({ ...quote, treasuryWallet });
});
