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
            subject: subject,
            html: `
        <div>
          <h2>${bodyTitle}</h2>
          <p>${greeting}</p>
          <p>${otpMsg}</p>
          <p><strong>${otp}</strong></p>
          <p>${otpExpiry}</p>
          <p>${ignoreMsg}</p>
          <p>${footer}</p>
        </div>
      `
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

        const lang = user.preferredLanguage || 'en';
        const subject = getTranslation(lang, 'authSubjectNewOtp');
        const bodyContent = getTranslation(lang, 'authBodyNewOtp', { otp });
        const validMsg = getTranslation(lang, 'authValidMinutes');

        await sendMail({
            to: email,
            subject: subject,
            html: `<h2>${bodyContent}</h2><p>${validMsg}</p>`
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
        const lang = user.preferredLanguage || 'en';
        sendMail({
            to: email,
            subject: "Password Reset OTP – Real-Hero",
            html: `
<div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:auto;background:#111;color:#fff;border-radius:12px;padding:32px;border:1px solid rgba(255,43,43,0.2)">
  <h2 style="color:#ff2b2b;margin:0 0 16px">🔑 Password Reset</h2>
  <p style="color:rgba(255,255,255,0.7);margin:0 0 8px">Hi ${user.name || 'there'},</p>
  <p style="color:rgba(255,255,255,0.7);margin:0 0 24px">Use the OTP below to reset your Real-Hero password. It expires in <strong>10 minutes</strong>.</p>
  <div style="text-align:center;background:rgba(255,43,43,0.1);border:1px solid rgba(255,43,43,0.3);border-radius:10px;padding:20px;letter-spacing:10px;font-size:32px;font-weight:800;color:#fff">${otp}</div>
  <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:24px 0 0">If you did not request this, please ignore this email.</p>
</div>`
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
