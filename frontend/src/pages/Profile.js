// frontend/src/pages/Profile.js
import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";

import { Box, Drawer, IconButton, Typography, CircularProgress, Button, Grid, Menu, MenuItem, Avatar, Divider, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";

import Sidebar from "../components/Sidebar";
import { authUtils } from "../utils/auth";
import ProfileHeader from "./ProfileComponents/ProfileHeader";
import ProfileOverview from "./ProfileComponents/ProfileOverview";
import ProfileDetails from "./ProfileComponents/ProfileDetails";

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
try {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (!/(localhost|127\.0\.0\.1)/.test(host)) {
            API_BASE = API_BASE.replace(/localhost|127\.0\.0\.1/, host);
        }
    }
} catch { }

export default function Profile() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isMobile = useMediaQuery("(max-width:900px)");
    const [openSidebar, setOpenSidebar] = useState(false);

    const [anchorEl, setAnchorEl] = useState(null);
    const profileOpen = Boolean(anchorEl);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [rewardLogs, setRewardLogs] = useState([]);
    const [userStats, setUserStats] = useState({
        donationsCount: 0,
        leaderboardPoints: 0,
        coins: 0,
        redeemedCoins: 0
    });

    // Password reset modal state (3-step OTP flow)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [pwStep, setPwStep] = useState(1); // 1=sendOtp, 2=verifyOtp, 3=newPassword
    const [pwOtpDigits, setPwOtpDigits] = useState(["", "", "", "", "", ""]);
    const [pwNewPassword, setPwNewPassword] = useState("");
    const [pwConfirmPassword, setPwConfirmPassword] = useState("");
    const [pwShowNew, setPwShowNew] = useState(false);
    const [pwShowConfirm, setPwShowConfirm] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [pwCooldown, setPwCooldown] = useState(0);
    const [pwResending, setPwResending] = useState(false);
    const pwInputRefs = useRef([]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        gender: "",
        dateOfBirth: "",
        bloodGroup: "",
        weight: "",
        profilePhoto: "",
        bio: "",
        badges: [],
        preferredLanguage: "en",
    });

    const [calculatedAge, setCalculatedAge] = useState("");

    // Cooldown countdown for OTP resend
    useEffect(() => {
        if (pwCooldown > 0) {
            const t = setTimeout(() => setPwCooldown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [pwCooldown]);

    useEffect(() => {
        if (!authUtils.isLoggedIn()) {
            navigate("/login");
        } else {
            loadProfile();
        }
        // eslint-disable-next-line
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/user/me`, {
                credentials: "include",
                headers: authUtils.getAuthHeaders()
            });
            if (!res.ok) throw new Error();

            const data = await res.json();

            setUserStats({
                donationsCount: data.donationsCount || 0,
                leaderboardPoints: data.leaderboardPoints || 0,
                coins: data.coins || 0,
                redeemedCoins: data.redeemedCoins || 0
            });

            try {
                const logsRes = await fetch(`${API_BASE}/api/rewards/my-rewards`, { headers: authUtils.getAuthHeaders() });
                if (logsRes.ok) {
                    const logsData = await logsRes.json();
                    setRewardLogs(logsData || []);
                }
            } catch (err) {
                console.error("Failed to fetch reward logs", err);
            }

            setFormData({
                name: data.name || "",
                email: data.email || "",
                phone: data.phone || "",
                gender: data.gender || "",
                dateOfBirth: data.dateOfBirth?.split("T")[0] || "",
                bloodGroup: data.bloodGroup || "",
                weight: data.weight || "",
                profilePhoto: data.profilePhoto || "",
                bio: data.bio || "",
                badges: data.badges || [],
                preferredLanguage: data.preferredLanguage || "en",
            });

            if (data.preferredLanguage) {
                i18n.changeLanguage(data.preferredLanguage);
            }
        } catch {
            Swal.fire(t('errorTitle'), t('profileLoadError'), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formData.dateOfBirth) {
            const dob = new Date(formData.dateOfBirth);
            const now = new Date();
            let age = now.getFullYear() - dob.getFullYear();
            const m = now.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
            setCalculatedAge(age);
        } else {
            setCalculatedAge("");
        }
    }, [formData.dateOfBirth]);

    const handleInput = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            return Swal.fire(t('errorTitle'), t('maxFileSizeError'), "error");
        }

        const reader = new FileReader();
        reader.onloadend = () => setFormData((prev) => ({ ...prev, profilePhoto: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (calculatedAge !== "" && (calculatedAge < 18 || calculatedAge > 65)) {
            return Swal.fire(t('invalidTitle'), t('ageRangeError'), "error");
        }
        if (formData.weight !== "" && formData.weight < 50) {
            return Swal.fire(t('invalidTitle'), t('minWeightError'), "error");
        }

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/user`, {
                method: "POST",
                credentials: "include",
                headers: authUtils.getAuthHeaders(),
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                if (res.status === 413) throw new Error(t('imageTooLargeError'));
                const txt = await res.text().catch(() => '');
                throw new Error(txt || `Server returned ${res.status}`);
            }

            const saved = await res.json().catch(() => null);
            if (saved) {
                setFormData((prev) => ({
                    ...prev,
                    name: saved.name || prev.name,
                    email: saved.email || prev.email,
                    phone: saved.phone || prev.phone,
                    gender: saved.gender || prev.gender,
                    dateOfBirth: saved.dateOfBirth ? saved.dateOfBirth.split('T')[0] : prev.dateOfBirth,
                    bloodGroup: saved.bloodGroup || saved.blood || prev.bloodGroup,
                    weight: saved.weight || prev.weight,
                    profilePhoto: saved.profilePhoto || prev.profilePhoto,
                    bio: saved.bio || prev.bio,
                    badges: saved.badges || prev.badges,
                }));
            }

            Swal.fire(t('successTitle'), t('profileUpdatedSuccess'), "success");
            setIsEditing(false);
            try { localStorage.removeItem('newUserProfile'); } catch (e) { }
            try { window.dispatchEvent(new CustomEvent('user-updated', { detail: saved })); } catch (e) { }
        } catch (e) {
            Swal.fire(t('errorTitle'), e?.message || t('profileUpdateFailed'), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = () => {
        setPwStep(1);
        setPwOtpDigits(["", "", "", "", "", ""]);
        setPwNewPassword("");
        setPwConfirmPassword("");
        setPwCooldown(0);
        setPasswordModalOpen(true);
    };

    // Step 1: Send OTP to logged-in user's email
    const handlePwSendOtp = async () => {
        setPasswordSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/forgot-password-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await res.json();
            if (res.ok) {
                setPwCooldown(60);
                setPwOtpDigits(["", "", "", "", "", ""]);
                setPwStep(2);
                setTimeout(() => pwInputRefs.current[0]?.focus(), 100);
            } else {
                Swal.fire(t('errorTitle'), data.message || "Failed to send OTP", "error");
            }
        } catch {
            Swal.fire(t('errorTitle'), "Network error", "error");
        } finally {
            setPasswordSaving(false);
        }
    };

    // Step 2: Verify OTP (just advance, OTP used in step 3)
    const handlePwVerifyOtp = () => {
        const otp = pwOtpDigits.join("");
        if (otp.length !== 6) {
            return Swal.fire(t('errorTitle'), "Please enter all 6 digits", "error");
        }
        setPwStep(3);
    };

    // Step 3: Reset Password
    const handlePasswordChange = async () => {
        if (pwNewPassword !== pwConfirmPassword) {
            return Swal.fire(t('errorTitle'), "Passwords do not match", "error");
        }
        if (pwNewPassword.length < 6) {
            return Swal.fire(t('errorTitle'), "Password must be at least 6 characters", "error");
        }
        setPasswordSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/reset-password-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, otp: pwOtpDigits.join(""), newPassword: pwNewPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                Swal.fire(t('errorTitle'), data.message || "Failed to reset password", "error");
                if (data.message?.toLowerCase().includes("otp")) setPwStep(2);
                return;
            }
            Swal.fire(t('successTitle'), "Password updated successfully", "success");
            setPasswordModalOpen(false);
        } catch {
            Swal.fire(t('errorTitle'), "Network error", "error");
        } finally {
            setPasswordSaving(false);
        }
    };

    // OTP box helpers for profile dialog
    const handlePwDigit = (index, value) => {
        const char = value.replace(/\D/g, "").slice(-1);
        const next = [...pwOtpDigits];
        next[index] = char;
        setPwOtpDigits(next);
        if (char && index < 5) pwInputRefs.current[index + 1]?.focus();
    };
    const handlePwKeyDown = (index, e) => {
        if (e.key === "Backspace" && !pwOtpDigits[index] && index > 0) pwInputRefs.current[index - 1]?.focus();
    };
    const handlePwPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const next = [...pwOtpDigits];
        for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
        setPwOtpDigits(next);
        pwInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };
    const handlePwResend = async () => {
        if (pwCooldown > 0 || pwResending) return;
        setPwResending(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/forgot-password-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });
            if (res.ok) {
                setPwCooldown(60);
                setPwOtpDigits(["", "", "", "", "", ""]);
                pwInputRefs.current[0]?.focus();
            }
        } catch { } finally { setPwResending(false); }
    };

    if (loading) {
        return (
            <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "black" }}>
                <CircularProgress sx={{ color: "#ff2b2b" }} />
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: "100vh",
            background: "radial-gradient(circle at top right, rgba(255,43,43,0.08), transparent 40%), radial-gradient(circle at bottom left, rgba(255,43,43,0.05), transparent 40%), linear-gradient(135deg, #050505 0%, #111111 100%)",
            color: "#fff",
            overflowX: "hidden",
            maxWidth: "100vw",
        }}>
            {/* Top Navigation */}
            <Box component="nav" sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                px: { xs: 2, md: 6 }, py: 2, background: "rgba(10,10,10,0.8)",
                backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,43,43,0.15)",
                position: "sticky", top: 0, zIndex: 1100
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpenSidebar(true)} aria-label="Open Sidebar">
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h5" component="h1" sx={{ color: "#eee", fontWeight: 700, letterSpacing: 0.5 }}>
                        Blood<span style={{ color: "#ff2b2b" }}>Connect</span>
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Open Profile Menu" sx={{
                        p: 0.5, border: "2px solid rgba(255,43,43,0.3)", borderRadius: "50%",
                        transition: "all 0.3s ease", "&:hover": { borderColor: "#ff2b2b", boxShadow: "0 0 15px rgba(255,43,43,0.5)" }
                    }}>
                        <Avatar src={formData?.profilePhoto} sx={{ width: 40, height: 40, bgcolor: "#ff2b2b" }}>
                            {!formData?.profilePhoto && (formData.name ? formData.name.charAt(0).toUpperCase() : "U")}
                        </Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}
                        PaperProps={{
                            sx: {
                                background: "rgba(20,20,20,0.95)", backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255,43,43,0.2)", color: "#fff", mt: 1.5
                            }
                        }}
                    >
                        <Box sx={{ px: 3, py: 2 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>{formData?.name}</Typography>
                            <Typography sx={{ color: "#ff2b2b", fontSize: "0.85rem", fontWeight: 600 }}>{formData?.email}</Typography>
                        </Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }} sx={{ "&:hover": { bgcolor: "rgba(255,43,43,0.1)" }, py: 1.5 }}>
                            <AccountCircleIcon fontSize="small" sx={{ mr: 1.5, color: "#ff2b2b" }} /> {t('profile')}
                        </MenuItem>
                        <MenuItem onClick={() => { authUtils.logout(); window.location.href = "/"; }} sx={{ "&:hover": { bgcolor: "rgba(255,43,43,0.1)" }, py: 1.5 }}>
                            <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: "#ff2b2b" }} /> {t('logout')}
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: { xs: 0, md: 4 }, px: { xs: 0, md: 4 }, py: { xs: 2, md: 4 } }}>
                <Box sx={{ width: 280, flexShrink: 0, display: { xs: "none", md: "block" } }}>
                    <Sidebar />
                </Box>
                <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)} sx={{ "& .MuiDrawer-paper": { width: 280, background: "#0a0a0a", borderRight: "1px solid rgba(255,43,43,0.15)" } }}>
                    <Sidebar />
                </Drawer>

                <Box component="main" sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 0 }, pb: 10 }}>
                    {/* Page Header */}
                    <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: "#fff", letterSpacing: -0.5, mb: 1 }}>
                                Account Settings
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
                                Manage your personal information, contact details, and platform preferences.
                            </Typography>
                        </Box>

                        {/* Desktop Action Buttons Top Right */}
                        <Box sx={{ display: "flex", gap: 2 }}>
                            {!isEditing ? (
                                <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}
                                    sx={{
                                        background: "linear-gradient(135deg, #ff2b2b 0%, #cc0000 100%)",
                                        boxShadow: "0 8px 25px rgba(255,43,43,0.4)", borderRadius: 3, px: 4, py: 1.5,
                                        fontWeight: 800, letterSpacing: 1,
                                        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(255,43,43,0.6)" }
                                    }}
                                >
                                    {t('editProfile')}
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outlined" onClick={() => { setIsEditing(false); loadProfile(); }} disabled={saving}
                                        sx={{
                                            color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)", borderRadius: 3, px: 3,
                                            "&:hover": { bgcolor: "rgba(255,255,255,0.05)", borderColor: "#fff", color: "#fff" }
                                        }}
                                    >
                                        {t('cancel')}
                                    </Button>
                                    <Button variant="contained" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={saving}
                                        sx={{
                                            background: "linear-gradient(135deg, #00c853 0%, #009624 100%)",
                                            boxShadow: "0 8px 25px rgba(0,200,83,0.4)", borderRadius: 3, px: 4, py: 1.5,
                                            fontWeight: 800, letterSpacing: 1,
                                            "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(0,200,83,0.6)" }
                                        }}
                                    >
                                        {saving ? t('saving') : "SAVE CHANGES"}
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* Main Content Grid */}
                    <ProfileHeader
                        formData={formData}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        handlePhotoUpload={handlePhotoUpload}
                        t={t}
                    />
                    <Grid container spacing={4}>
                        {/* Left Column (Overview) */}
                        <Grid item xs={12} lg={4}>
                            <Box sx={{ position: { lg: "sticky" }, top: { lg: 100 } }}>
                                <ProfileOverview
                                    formData={formData}
                                    rewardLogs={rewardLogs}
                                />
                            </Box>
                        </Grid>

                        {/* Right Column (Forms) */}
                        <Grid item xs={12} lg={8}>
                            <ProfileDetails
                                t={t}
                                formData={formData}
                                handleInput={handleInput}
                                isEditing={isEditing}
                                calculatedAge={calculatedAge}
                                handleResetPassword={handleResetPassword}
                                userStats={userStats}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* Password Reset Modal — 3-step OTP flow */}
            <Dialog open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg, #0d0d0d 0%, #1a0a0a 100%)", border: "1px solid rgba(255,45,45,0.25)", borderRadius: 3, color: "#fff", fontFamily: "'Poppins',sans-serif" } }}>

                <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LockIcon sx={{ color: "#ff2d2d" }} />
                        <Typography sx={{ fontWeight: 800 }}>Change Password</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {/* Step pills */}
                        {[1, 2, 3].map(s => (
                            <Box key={s} sx={{
                                width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                                background: pwStep > s ? "#22c55e" : pwStep === s ? "linear-gradient(135deg,#ff2b2b,#b60000)" : "rgba(255,255,255,0.08)",
                                color: pwStep >= s ? "#fff" : "rgba(255,255,255,0.3)", boxShadow: pwStep === s ? "0 0 10px rgba(255,43,43,0.4)" : "none", transition: "all 0.3s"
                            }}>
                                {pwStep > s ? "✓" : s}
                            </Box>
                        ))}
                        <IconButton size="small" onClick={() => setPasswordModalOpen(false)} sx={{ color: "rgba(255,255,255,0.4)" }}><CloseIcon fontSize="small" /></IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {/* Step 1: Confirm Email & Send OTP */}
                    {pwStep === 1 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center" }}>
                                We'll send a verification code to your registered email.
                            </Typography>
                            <Box sx={{ background: "rgba(255,43,43,0.08)", border: "1px solid rgba(255,43,43,0.2)", borderRadius: 2, px: 2, py: 1.5, textAlign: "center" }}>
                                <Typography sx={{ color: "#ff5a5a", fontWeight: 600, fontSize: 14 }}>📧 {formData.email}</Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Step 2: OTP Entry */}
                    {pwStep === 2 && (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center" }}>
                                Enter the 6-digit code sent to <span style={{ color: "#ff5a5a", fontWeight: 600 }}>{formData.email}</span>
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "center", my: 1 }}>
                                {pwOtpDigits.map((d, i) => (
                                    <motion.input key={i} ref={el => (pwInputRefs.current[i] = el)}
                                        type="text" inputMode="numeric" maxLength={1} value={d}
                                        onChange={e => handlePwDigit(i, e.target.value)}
                                        onKeyDown={e => handlePwKeyDown(i, e)}
                                        onPaste={handlePwPaste}
                                        autoFocus={i === 0}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                                        style={{
                                            width: 44, height: 52, borderRadius: 10, border: d ? "2px solid rgba(255,43,43,0.5)" : "2px solid rgba(255,255,255,0.12)",
                                            background: d ? "rgba(255,43,43,0.07)" : "rgba(255,255,255,0.05)", color: "#fff", fontSize: 22, fontWeight: 700,
                                            textAlign: "center", outline: "none", fontFamily: "'Poppins',sans-serif", caretColor: "#ff2b2b"
                                        }}
                                    />
                                ))}
                            </Box>
                            {/* Resend */}
                            <Box sx={{ textAlign: "center" }}>
                                {pwCooldown > 0 ? (
                                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Resend in {pwCooldown}s</Typography>
                                ) : (
                                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                                        Didn't receive it?{" "}
                                        <span onClick={handlePwResend} style={{ color: pwResending ? "rgba(255,90,90,0.4)" : "#ff5a5a", cursor: "pointer", fontWeight: 600 }}>
                                            {pwResending ? "Sending…" : "Resend Code"}
                                        </span>
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Step 3: New Password */}
                    {pwStep === 3 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box sx={{ position: "relative" }}>
                                <input type={pwShowNew ? "text" : "password"} placeholder="New Password (min. 6 chars)"
                                    value={pwNewPassword} onChange={e => setPwNewPassword(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "13px 44px 13px 14px", color: "#fff", fontFamily: "'Poppins',sans-serif", fontSize: 14, outline: "none" }}
                                />
                                <span onClick={() => setPwShowNew(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 16 }}>{pwShowNew ? "🙈" : "👁"}</span>
                            </Box>
                            <Box sx={{ position: "relative" }}>
                                <input type={pwShowConfirm ? "text" : "password"} placeholder="Confirm New Password"
                                    value={pwConfirmPassword} onChange={e => setPwConfirmPassword(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "13px 44px 13px 14px", color: "#fff", fontFamily: "'Poppins',sans-serif", fontSize: 14, outline: "none" }}
                                />
                                <span onClick={() => setPwShowConfirm(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 16 }}>{pwShowConfirm ? "🙈" : "👁"}</span>
                            </Box>
                            {pwNewPassword && pwConfirmPassword && (
                                <Typography sx={{ fontSize: 12, color: pwNewPassword === pwConfirmPassword ? "#22c55e" : "#ff5a5a" }}>
                                    {pwNewPassword === pwConfirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2.5, pt: 1, borderTop: "1px solid rgba(255,255,255,0.06)", gap: 1 }}>
                    <Button onClick={() => setPasswordModalOpen(false)} sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Cancel</Button>
                    {pwStep === 1 && (
                        <Button variant="contained" onClick={handlePwSendOtp} disabled={passwordSaving}
                            sx={{ background: "linear-gradient(135deg,#ff2b2b,#b60000)", color: "#fff", fontWeight: 700, borderRadius: 2, fontSize: 13, "&:hover": { background: "#cc0000" } }}>
                            {passwordSaving ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Send Verification Code"}
                        </Button>
                    )}
                    {pwStep === 2 && (
                        <Button variant="contained" onClick={handlePwVerifyOtp} disabled={pwOtpDigits.join("").length < 6}
                            sx={{ background: "linear-gradient(135deg,#ff2b2b,#b60000)", color: "#fff", fontWeight: 700, borderRadius: 2, fontSize: 13, "&:hover": { background: "#cc0000" } }}>
                            ✓ Verify Code
                        </Button>
                    )}
                    {pwStep === 3 && (
                        <Button variant="contained" onClick={handlePasswordChange} disabled={passwordSaving || (pwNewPassword && pwConfirmPassword && pwNewPassword !== pwConfirmPassword)}
                            sx={{ background: "linear-gradient(135deg,#ff2b2b,#b60000)", color: "#fff", fontWeight: 700, borderRadius: 2, fontSize: 13, "&:hover": { background: "#cc0000" } }}>
                            {passwordSaving ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "🔒 Update Password"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
