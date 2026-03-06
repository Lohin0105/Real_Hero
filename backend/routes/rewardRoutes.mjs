// backend/routes/rewardRoutes.mjs
import express from "express";
import { getLeaderboard, getMyRewards } from "../controllers/rewardController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.get("/leaderboard", getLeaderboard);
router.get("/my-rewards", authMiddleware, getMyRewards);

export default router;
