import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { isValidWalletAddress } from "../middleware/validateWallet";
import * as inventoryService from "../services/inventoryService";

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const { wallet } = req.params;
  if (!isValidWalletAddress(wallet)) throw new ApiError(400, "Invalid wallet");
  const inventory = await inventoryService.getInventory(wallet);
  res.json(inventory);
});

export const useItem = asyncHandler(async (req: Request, res: Response) => {
  const { ownerWallet, petId, itemKey } = req.body;
  if (!isValidWalletAddress(ownerWallet)) throw new ApiError(400, "Invalid ownerWallet");
  if (!petId || !itemKey) throw new ApiError(400, "petId and itemKey are required");
  const pet = await inventoryService.useItem(ownerWallet, petId, itemKey);
  res.json(pet);
});
