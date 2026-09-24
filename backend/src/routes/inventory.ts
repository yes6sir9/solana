import { Router } from "express";
import * as inventoryController from "../controllers/inventoryController";

const router = Router();

router.get("/:wallet", inventoryController.getInventory);
router.post("/use", inventoryController.useItem);

export default router;
