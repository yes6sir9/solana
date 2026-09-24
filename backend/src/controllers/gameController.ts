import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { isValidWalletAddress } from "../middleware/validateWallet";
import { completeGame, getGameCatalog } from "../services/gameService";

export const listGames = asyncHandler(async (_req: Request, res: Response) => {
  res.json(getGameCatalog());
});

export const completeGameHandler = asyncHandler(async (req: Request, res: Response) => {
  const { wallet, score, petId } = req.body;
  if (!isValidWalletAddress(wallet)) throw new ApiError(400, "Invalid wallet");
  if (typeof score !== "number" || Number.isNaN(score)) throw new ApiError(400, "score must be a number");

  const result = await completeGame(wallet, req.params.id, score, petId);
  res.json(result);
});
