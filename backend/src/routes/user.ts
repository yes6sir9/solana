import { Router } from "express";
import { getProfile } from "../controllers/userController";

const router = Router();
router.get("/:wallet", getProfile);

export default router;
