import { Router } from "express";
import * as marketplaceController from "../controllers/marketplaceController";

const router = Router();

router.get("/", marketplaceController.getListings);
router.post("/list", marketplaceController.createListing);
router.post("/:id/cancel", marketplaceController.cancelListing);
router.post("/buy", marketplaceController.buyListing);

export default router;
