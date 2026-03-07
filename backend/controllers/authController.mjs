import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.mjs";
import { generateOTP } from "../utils/generateOTP.mjs";
import { sendMail } from "../utils/emailNotifier.mjs";
import { getTranslation } from "../utils/translationManager.mjs";

/**
 * POST /api/auth/register
 * Body: { email, password, name }
 */
export const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ message: "User already exists and is verified" });
            }
            // If user exists but not verified, we can allow re-registration (updates OTP)
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        const userData = {
            email,
            password: hashedPassword,
            name: name || email.split("@")[0],
            otp: hashedOtp,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            otpAttempts: 0,
            lastOtpSent: new Date(),
            locationGeo: { type: "Point", coordinates: [0, 0] } // Default placeholder for geospatial queries
        };

        if (existingUser) {
            Object.assign(existingUser, userData);
            await existingUser.save();
        } else {
            // For legacy compatibility, handle UID as email or unique string if needed
            userData.uid = `local-${Date.now()}`;
            await User.create(userData);
        }

        // ✅ Respond to the client IMMEDIATELY — don't wait for email
        // This prevents frontend timeout on Render free tier where first SMTP
        // connection can take 30-90 seconds
        res.status(201).json({ ok: true, message: "OTP sent to email. Please verify." });

        // Send OTP email in the BACKGROUND (non-blocking)
        const lang = existingUser?.preferredLanguage || 'en';
        const subject = getTranslation(lang, 'authSubjectVerify');
        const bodyTitle = getTranslation(lang, 'authBodyVerify');
        const greeting = getTranslation(lang, 'authGreeting');
        const otpMsg = getTranslation(lang, 'authOtpMessage');
        const otpExpiry = getTranslation(lang, 'authOtpExpiry');
        const ignoreMsg = getTranslation(lang, 'authIgnore');
        const footer = getTranslation(lang, 'authFooter');

        sendMail({
            to: email,
            subject: "Your Real-Hero Verification Code",
            html: `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;font-size:15px;color:#222;background:#fff;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:8px;background:#fff">
  <tr><td style="background:#c0392b;padding:20px 32px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:20px">Real-Hero — Email Verification</h2>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 12px">Hello ${userData.name || email.split('@')[0]},</p>
    <p style="margin:0 0 20px">Your one-time verification code is:</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#c0392b;padding:16px 0;text-align:center;border-top:1px solid #eee;border-bottom:1px solid #eee;margin-bottom:20px">${otp}</div>
    <p style="margin:0 0 8px">This code is valid for <strong>10 minutes</strong>.</p>
    <p style="margin:0;color:#666;font-size:13px">If you did not create an account, please ignore this email.</p>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #eee;color:#999;font-size:12px">Real-Hero &bull; Blood Donation Platform</td></tr>
</table>
</td></tr></table>
</body></html>`,
            text: `Your Real-Hero verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not create an account, ignore this email.`
        }).then(emailRes => {
            if (!emailRes.ok) {
                console.error("Failed to send OTP email:", emailRes.error);
            } else {
                console.log("OTP email sent to:", email);
            }
        }).catch(err => {
            console.error("OTP email error:", err);
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 */
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.isVerified) return res.status(400).json({ message: "Account already verified" });

        // Check expiry
        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        // Check attempts limit
        if (user.otpAttempts >= 5) {
            return res.status(403).json({ message: "Too many attempts. Please wait or request a new OTP." });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Success
        user.isVerified = true;
        user.available = true; // Mark as available by default upon verification
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "7d" }
        );

        res.json({ ok: true, message: "Verified successfully", token, user: { name: user.name, email: user.email, uid: user.uid } });

    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Verification process failed" });
    }
};

/**
 * POST /api/auth/resend-otp
 * Body: { email }
 */
export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Cooldown check (60 seconds)
        if (user.lastOtpSent && user.lastOtpSent.getTime() + 60 * 1000 > Date.now()) {
            return res.status(429).json({ message: "Please wait 60 seconds before requesting a new OTP." });
        }

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otp = hashedOtp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpAttempts = 0;
        user.lastOtpSent = new Date();
        await user.save();

        await sendMail({
            to: email,
            subject: "Your New Real-Hero Verification Code",
            html: `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;font-size:15px;color:#222;background:#fff;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:8px;background:#fff">
  <tr><td style="background:#c0392b;padding:20px 32px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:20px">Real-Hero — New Verification Code</h2>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 20px">Here is your new one-time verification code:</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#c0392b;padding:16px 0;text-align:center;border-top:1px solid #eee;border-bottom:1px solid #eee;margin-bottom:20px">${otp}</div>
    <p style="margin:0 0 8px">This code is valid for <strong>10 minutes</strong>.</p>
    <p style="margin:0;color:#666;font-size:13px">If you did not request this, please ignore this email.</p>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #eee;color:#999;font-size:12px">Real-Hero &bull; Blood Donation Platform</td></tr>
</table>
</td></tr></table>
</body></html>`,
            text: `Your new Real-Hero verification code is: ${otp}\n\nThis code expires in 10 minutes.`
        });

        res.json({ ok: true, message: "New OTP sent to your email." });

    } catch (error) {
        console.error("Resend error:", error);
        res.status(500).json({ message: "Failed to resend OTP" });
    }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email address first.", isVerified: false });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "7d" }
        );

        res.json({ ok: true, token, user: { name: user.name, email: user.email, uid: user.uid } });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
};

/**
 * POST /api/auth/forgot-password-otp
 * Body: { email }
 * Sends a 6-digit OTP to the user's email for password reset.
 */
export const forgotPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal whether the user exists – return generic ok
            return res.json({ ok: true, message: "If that email is registered, an OTP has been sent." });
        }

        // Cooldown check (60 seconds)
        if (user.lastOtpSent && user.lastOtpSent.getTime() + 60 * 1000 > Date.now()) {
            return res.status(429).json({ message: "Please wait 60 seconds before requesting a new OTP." });
        }

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otp = hashedOtp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otpAttempts = 0;
        user.lastOtpSent = new Date();
        await user.save();

        // Respond immediately so the UI isn't blocked
        res.json({ ok: true, message: "If that email is registered, an OTP has been sent." });

        // Send OTP email in the background
        sendMail({
            to: email,
            subject: "Real-Hero Password Reset Code",
            html: `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;font-size:15px;color:#222;background:#fff;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:8px;background:#fff">
  <tr><td style="background:#c0392b;padding:20px 32px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:20px">Real-Hero — Password Reset</h2>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 12px">Hi ${user.name || 'there'},</p>
    <p style="margin:0 0 20px">Use this code to reset your password. It expires in <strong>10 minutes</strong>.</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#c0392b;padding:16px 0;text-align:center;border-top:1px solid #eee;border-bottom:1px solid #eee;margin-bottom:20px">${otp}</div>
    <p style="margin:0;color:#666;font-size:13px">If you did not request a password reset, please ignore this email.</p>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #eee;color:#999;font-size:12px">Real-Hero &bull; Blood Donation Platform</td></tr>
</table>
</td></tr></table>
</body></html>`,
            text: `Your Real-Hero password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`
        }).then(r => {
            if (!r.ok) console.error("Failed to send password reset OTP:", r.error);
            else console.log("Password reset OTP sent to:", email);
        }).catch(err => console.error("Password reset OTP email error:", err));

    } catch (error) {
        console.error("forgotPasswordOtp error:", error);
        res.status(500).json({ message: "Failed to process request", error: error.message });
    }
};

/**
 * POST /api/auth/reset-password-otp
 * Body: { email, otp, newPassword }
 * Verifies OTP and sets a new password.
 */
export const resetPasswordWithOtp = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({ message: "No pending OTP. Please request a new one." });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        if (user.otpAttempts >= 5) {
            return res.status(403).json({ message: "Too many attempts. Please request a new OTP." });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // OTP verified — update password
        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        user.lastOtpSent = undefined;
        await user.save();

        res.json({ ok: true, message: "Password reset successfully" });

    } catch (error) {
        console.error("resetPasswordWithOtp error:", error);
        res.status(500).json({ message: "Failed to reset password", error: error.message });
    }
};
