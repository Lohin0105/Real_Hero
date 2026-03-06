import express from "express";
import { getRedemptionOptions, redeemOption, getRedemptionHistory } from "../controllers/redeemController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.get("/options", getRedemptionOptions);              // public — no auth needed to view
router.post("/redeem", authMiddleware, redeemOption);       // requires login
router.get("/history", authMiddleware, getRedemptionHistory); // requires login

export default router;
