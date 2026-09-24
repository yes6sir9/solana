import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { buildPetImageSvg, buildPetMetadata } from "../services/metadataService";

export const getMetadata = asyncHandler(async (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const metadata = await buildPetMetadata(req.params.id, baseUrl);
  res.json(metadata);
});

export const getImage = asyncHandler(async (req: Request, res: Response) => {
  const svg = await buildPetImageSvg(req.params.id);
  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
});
