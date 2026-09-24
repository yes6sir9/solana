import { Router } from "express";
import { getMintPrice } from "../controllers/economyController";

const router = Router();
router.get("/mint-price", getMintPrice);

export default router;
