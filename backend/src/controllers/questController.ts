import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { isValidWalletAddress } from "../middleware/validateWallet";
import { completeQuest, getQuestsForWallet } from "../services/questService";

export const listQuests = asyncHandler(async (req: Request, res: Response) => {
  const { wallet } = req.query;
  if (!isValidWalletAddress(wallet)) throw new ApiError(400, "wallet query param is required");
  res.json(await getQuestsForWallet(wallet as string));
});

export const completeQuestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { wallet } = req.body;
  if (!isValidWalletAddress(wallet)) throw new ApiError(400, "Invalid wallet");
  res.json(await completeQuest(wallet, req.params.id));
});
