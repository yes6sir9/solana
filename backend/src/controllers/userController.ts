import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { isValidWalletAddress } from "../middleware/validateWallet";
import { getUserProfile } from "../services/userService";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { wallet } = req.params;
  if (!isValidWalletAddress(wallet)) throw new ApiError(400, "Invalid wallet");
  const profile = await getUserProfile(wallet);
  res.json(profile);
});
