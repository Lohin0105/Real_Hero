// frontend/src/pages/Profile.js
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { Box, Drawer, IconButton, Typography, CircularProgress, Button, Grid, Menu, MenuItem, Avatar, Divider, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment } from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
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

    // Password reset modal state
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    const [passwordSaving, setPasswordSaving] = useState(false);

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
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordModalOpen(true);
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            return Swal.fire(t('errorTitle'), "All password fields are required", "error");
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return Swal.fire(t('errorTitle'), "New passwords do not match", "error");
        }
        if (passwordData.newPassword.length < 6) {
            return Swal.fire(t('errorTitle'), "New password must be at least 6 characters", "error");
        }

        setPasswordSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/user/change-password`, {
                method: "POST",
                credentials: "include",
                headers: authUtils.getAuthHeaders(),
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to update password");

            Swal.fire(t('successTitle'), "Password updated successfully", "success");
            setPasswordModalOpen(false);
        } catch (e) {
            Swal.fire(t('errorTitle'), e.message || "Failed to change password", "error");
        } finally {
            setPasswordSaving(false);
        }
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

            {/* Password Reset Modal */}
            <Dialog open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg, #111 0%, #190a25 100%)", border: "1px solid rgba(255,45,45,0.3)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LockIcon sx={{ color: "#ff2d2d" }} />
                        <Typography sx={{ fontWeight: 800 }}>Change Password</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setPasswordModalOpen(false)} sx={{ color: "rgba(255,255,255,0.4)" }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                    <TextField
                        label="Current Password" type={showPassword.current ? "text" : "password"} fullWidth
                        value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })} edge="end" sx={{ color: "rgba(255,255,255,0.4)" }}>
                                        {showPassword.current ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: 2 }
                        }}
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)", "&.Mui-focused": { color: "#ff2d2d" } } }}
                    />
                    <TextField
                        label="New Password" type={showPassword.new ? "text" : "password"} fullWidth
                        value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })} edge="end" sx={{ color: "rgba(255,255,255,0.4)" }}>
                                        {showPassword.new ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: 2 }
                        }}
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)", "&.Mui-focused": { color: "#ff2d2d" } } }}
                    />
                    <TextField
                        label="Confirm New Password" type={showPassword.confirm ? "text" : "password"} fullWidth
                        value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} edge="end" sx={{ color: "rgba(255,255,255,0.4)" }}>
                                        {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: 2 }
                        }}
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)", "&.Mui-focused": { color: "#ff2d2d" } } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <Button onClick={() => setPasswordModalOpen(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
                    <Button
                        variant="contained" onClick={handlePasswordChange} disabled={passwordSaving}
                        sx={{ background: "#ff2d2d", color: "#fff", fontWeight: 700, borderRadius: 2, "&:hover": { background: "#e60000" } }}
                    >
                        {passwordSaving ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Update Password"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
