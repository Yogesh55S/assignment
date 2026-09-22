import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(AuthController.register));
router.post("/login", asyncHandler(AuthController.login));
router.post("/logout", asyncHandler(AuthController.logout));
router.get("/me", requireAuth, asyncHandler(AuthController.me));

export default router;
