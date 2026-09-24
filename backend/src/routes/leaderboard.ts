import { Router } from "express";
import { getLeaderboardHandler } from "../controllers/leaderboardController";

const router = Router();
router.get("/", getLeaderboardHandler);

export default router;
