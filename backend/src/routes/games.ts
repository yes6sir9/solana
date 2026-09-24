import { Router } from "express";
import * as gameController from "../controllers/gameController";

const router = Router();
router.get("/", gameController.listGames);
router.post("/:id/complete", gameController.completeGameHandler);

export default router;
