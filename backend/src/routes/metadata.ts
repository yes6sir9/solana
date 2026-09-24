import { Router } from "express";
import * as metadataController from "../controllers/metadataController";

const router = Router();
router.get("/:id", metadataController.getMetadata);
router.get("/:id/image", metadataController.getImage);

export default router;
