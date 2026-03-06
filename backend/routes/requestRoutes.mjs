// backend/routes/requestRoutes.mjs
import express from "express";
import {
    createRequest,
    getRecentRequests,
    geocodeMissingRequests,
    claimRequest,
    registerInterest,
    confirmInterest,
    verifyArrival,
    completeDonation,
    cancelDonation,
    getMyRequests,
    getMyDonations,
    closeRequest,
    verifyDonation,
    watchRequest
} from "../controllers/requestController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/create", authMiddleware, createRequest);
router.get("/recent", getRecentRequests);
router.post("/geocode-missing", geocodeMissingRequests);

// Claim System Routes
router.post("/claim/:id", authMiddleware, claimRequest);
router.post("/interest/:id", authMiddleware, registerInterest);
router.post("/watch/:id", authMiddleware, watchRequest);
router.get("/confirm-interest/:id", confirmInterest);
router.post("/verify-arrival/:id", authMiddleware, verifyArrival);
router.post("/complete/:id", authMiddleware, completeDonation);
router.post("/cancel/:id", authMiddleware, cancelDonation);
router.post("/close/:id", authMiddleware, closeRequest);
router.get("/verify-donation/:id", verifyDonation);
router.get("/my-requests", authMiddleware, getMyRequests);
router.get("/my-donations", authMiddleware, getMyDonations);

export default router;
