import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { getLeaderboard } from "../services/leaderboardService";

export const getLeaderboardHandler = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const leaderboard = await getLeaderboard(limit);
  res.json(leaderboard);
});
