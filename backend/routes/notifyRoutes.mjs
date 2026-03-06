import express from "express";
import { shareAvailability, createOffer, respondOffer, getNotifications, markNotificationsRead, followUpRespond } from "../controllers/notifyController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/share-availability", authMiddleware, shareAvailability);
router.post("/offer", authMiddleware, createOffer);
router.get("/offer/respond", respondOffer); // Public email response
router.get("/offer/followup/respond", followUpRespond); // Public email response
router.get("/notifications", authMiddleware, getNotifications);
router.post("/notifications/mark-read", authMiddleware, markNotificationsRead);

export default router;
