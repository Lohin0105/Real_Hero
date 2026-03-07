import express from "express";
import * as authController from "../controllers/authController.mjs";

const router = express.Router();

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/login", authController.login);
router.post("/forgot-password-otp", authController.forgotPasswordOtp);
router.post("/reset-password-otp", authController.resetPasswordWithOtp);

export default router;
