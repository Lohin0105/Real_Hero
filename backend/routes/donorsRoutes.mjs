// backend/routes/donorsRoutes.mjs
import express from "express";
import { updateAvailability, getNearbyDonors } from "../controllers/donorsController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/availability", authMiddleware, updateAvailability);
router.get("/nearby", getNearbyDonors);

export default router;
