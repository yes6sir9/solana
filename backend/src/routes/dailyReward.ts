import { Router } from "express";
import * as dailyRewardController from "../controllers/dailyRewardController";

const router = Router();
router.get("/:wallet", dailyRewardController.getStatus);
router.post("/claim", dailyRewardController.claim);

export default router;
