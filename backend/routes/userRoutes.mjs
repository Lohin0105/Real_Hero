// backend/routes/userRoutes.mjs
import express from "express";
import {
  saveUser,
  getUserByQuery,
  getCurrentUser,
  updateAvailability,
  updateLocation,
  changePassword,
} from "../controllers/userController.mjs";
import { getLeaderboard } from "../controllers/userController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/", authMiddleware, saveUser);
router.get("/", authMiddleware, getUserByQuery);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/availability", authMiddleware, updateAvailability);
router.post("/location", authMiddleware, updateLocation);
router.post("/change-password", authMiddleware, changePassword);
router.get("/leaderboard", getLeaderboard);

export default router;
