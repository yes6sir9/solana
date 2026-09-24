import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { isValidWalletAddress } from "../middleware/validateWallet";
import { claimDailyReward, getDailyRewardStatus } from "../services/dailyRewardService";

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const { wallet } = req.params;
  if (!isValidWalletAddress(wallet)) throw new ApiError(400, "Invalid wallet");
  res.json(await getDailyRewardStatus(wallet));
});

export const claim = asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.body;
  if (!isValidWalletAddress(walletAddress)) throw new ApiError(400, "Invalid walletAddress");
  res.json(await claimDailyReward(walletAddress));
});
