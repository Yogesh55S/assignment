import { Router } from "express";
import { KitController } from "../controllers/kitController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// All kit routes require authentication
router.use(requireAuth);

router.get("/", asyncHandler(KitController.getKits));
router.post("/", asyncHandler(KitController.createKit));
router.get("/:id", asyncHandler(KitController.getKitById));
router.get("/:id/status", asyncHandler(KitController.getKitStatus));
router.patch("/:id", asyncHandler(KitController.updateKit));
router.delete("/:id", asyncHandler(KitController.deleteKit));
router.post("/:id/regenerate", asyncHandler(KitController.regenerateSection));
router.get("/:id/practice", asyncHandler(KitController.getPractice));
router.post("/:id/practice", asyncHandler(KitController.savePractice));

export default router;

