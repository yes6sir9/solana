import { Router } from "express";
import * as questController from "../controllers/questController";

const router = Router();
router.get("/", questController.listQuests);
router.post("/:id/complete", questController.completeQuestHandler);

export default router;
