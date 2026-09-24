import { Router } from "express";
import * as petController from "../controllers/petController";

const router = Router();

// POST /api/pets/mint — pays SOL + generates DNA + creates the pet (see petService.mintPet).
router.post("/mint", petController.mintPet);
router.get("/:id", petController.getPet);
router.post("/:id/feed", petController.feedPet);
router.post("/:id/play", petController.playWithPet);
router.post("/:id/rest", petController.restPet);
router.post("/:id/train", petController.trainPet);
router.post("/:id/equip", petController.equipAccessory);
// POST /api/pets/:id/mint — records the *separate* on-chain Metaplex NFT mint for an existing pet.
router.post("/:id/mint", petController.recordMint);
router.get("/wallet/:wallet", petController.getPetsForWallet);

export default router;
