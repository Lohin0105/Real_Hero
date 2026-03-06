// frontend/src/pages/LanguageSettings.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Swal from "sweetalert2";
import {
    Box,
    Drawer,
    IconButton,
    Typography,
    Avatar,
    useMediaQuery,
    Menu,
    MenuItem,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Grid,
    Divider
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageIcon from "@mui/icons-material/Language";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";

import Sidebar from "../components/Sidebar";
import { authUtils } from "../utils/auth";

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
try {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (!/(localhost|127\\.0\\.0\\.1)/.test(host)) {
            API_BASE = API_BASE.replace(/localhost|127\\.0\\.0\\.1/, host);
        }
    }
} catch { }

const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
];

export default function LanguageSettings() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isMobile = useMediaQuery("(max-width:900px)");
    const [openSidebar, setOpenSidebar] = useState(false);

    const [anchorEl, setAnchorEl] = useState(null);
    const profileOpen = Boolean(anchorEl);

    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        if (authUtils.isLoggedIn()) {
            loadUserData();
        } else {
            navigate("/login");
        }
    }, []);

    const loadUserData = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/user/me`, {
                credentials: "include",
                headers: authUtils.getAuthHeaders()
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setUserData(data);

            // Set current language from user preference
            if (data.preferredLanguage) {
                setSelectedLanguage(data.preferredLanguage);
                i18n.changeLanguage(data.preferredLanguage);
            }
        } catch {
            console.error("Failed to load user data");
        }
    };

    const handleLanguageSelect = async (langCode) => {
        setSelectedLanguage(langCode);

        // Change UI language immediately
        i18n.changeLanguage(langCode);

        // Save to backend
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/user`, {
                method: "POST",
                credentials: "include",
                headers: authUtils.getAuthHeaders(),
                body: JSON.stringify({
                    ...userData,
                    preferredLanguage: langCode
                }),
            });

            if (!res.ok) throw new Error();

            Swal.fire({
                title: t('languageChanged') || 'Language Changed!',
                text: t('languageChangedMessage') || `Interface language changed to ${languages.find(l => l.code === langCode)?.native}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (e) {
            Swal.fire("Error", t('languageChangeFailed') || "Failed to save language preference", "error");
        }
        setSaving(false);
    };

    const initials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b0b0b 0%, #151515 100%)", color: "#fff", overflowX: "hidden", maxWidth: "100vw" }}>
            {/* TOP NAV */}
            <Box
                sx={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    px: { xs: 2, md: 6 }, py: 2, borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpenSidebar(true)}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 800, textShadow: "0 0 18px rgba(255,20,20,0.85)" }}>
                        Real-Hero
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar src={userData?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)" }}>
                            {!userData?.profilePhoto && initials(userData?.name)}
                        </Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}
                        PaperProps={{
                            sx: {
                                bgcolor: "rgba(20,20,20,0.95)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff", mt: 1.5,
                            }
                        }}
                    >
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>{userData?.name}</Typography>
                            <Typography variant="caption" sx={{ color: "#777" }}>{userData?.email}</Typography>
                        </Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                        <MenuItem onClick={() => navigate("/profile")} sx={{ "&:hover": { bgcolor: "rgba(255,43,43,0.1)" } }}>
                            <AccountCircleIcon fontSize="small" sx={{ mr: 1, color: "#aaa" }} /> {t('profile')}
                        </MenuItem>
                        <MenuItem onClick={() => { authUtils.logout(); window.location.href = "/"; }} sx={{ "&:hover": { bgcolor: "rgba(255,43,43,0.1)" }, color: "#ff5252" }}>
                            <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> {t('logout')}
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 4, px: { xs: 0, md: 4 }, py: { xs: 2, md: 4 } }}>
                {!isMobile && (
                    <Box sx={{ width: 260, flexShrink: 0 }}>
                        <Sidebar />
                    </Box>
                )}

                {isMobile && (
                    <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)} sx={{ "& .MuiDrawer-paper": { width: 260, background: "#0b0b0b", borderRight: "1px solid rgba(255,43,43,0.1)" } }}>
                        <Sidebar />
                    </Drawer>
                )}

                <Box sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{
                            width: 56, height: 56, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
                            background: "linear-gradient(135deg, rgba(255,43,43,0.2) 0%, rgba(255,43,43,0.05) 100%)",
                            border: "1px solid rgba(255,43,43,0.3)", boxShadow: "0 8px 32px rgba(255,43,43,0.15)"
                        }}>
                            <LanguageIcon sx={{ fontSize: 32, color: '#ff2b2b' }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#ff2b2b", textShadow: "0 0 20px rgba(255,43,43,0.3)", letterSpacing: 0.5 }}>
                                {t('languageSettings') || 'Language Settings'}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mt: 0.5 }}>
                                {t('languageSettingsDescription') || 'Select your preferred language. The entire interface will automatically translate to your chosen language.'}
                            </Typography>
                        </Box>
                    </Box>

                    {saving && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3, p: 2, borderRadius: 2, background: "rgba(255,43,43,0.05)", border: "1px solid rgba(255,43,43,0.2)" }}>
                            <CircularProgress size={20} sx={{ color: '#ff2b2b' }} />
                            <Typography sx={{ color: "#ff2b2b", fontWeight: 700, fontSize: "0.85rem", letterSpacing: 1, textTransform: "uppercase" }}>Applying Changes...</Typography>
                        </Box>
                    )}

                    <Box sx={{ mt: 5 }}>
                        <Grid container spacing={2.5}>
                            {languages.map((lang) => {
                                const isSelected = selectedLanguage === lang.code;
                                return (
                                    <Grid item xs={6} sm={4} md={3} lg={2.4} key={lang.code}>
                                        <Card
                                            onClick={() => !saving && handleLanguageSelect(lang.code)}
                                            sx={{
                                                position: 'relative', overflow: 'hidden', height: '100%',
                                                background: isSelected
                                                    ? "linear-gradient(135deg, rgba(255,43,43,0.15) 0%, rgba(255,43,43,0.05) 100%)"
                                                    : "rgba(255,255,255,0.02)",
                                                border: isSelected ? "1px solid rgba(255,43,43,0.6)" : "1px solid rgba(255,255,255,0.05)",
                                                borderRadius: 3, backdropFilter: "blur(10px)", cursor: saving ? "wait" : "pointer",
                                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                boxShadow: isSelected ? "0 8px 32px rgba(255,43,43,0.2)" : "none",
                                                "&:hover": {
                                                    transform: saving ? "none" : "translateY(-4px)",
                                                    background: isSelected ? undefined : "rgba(255,255,255,0.04)",
                                                    borderColor: isSelected ? "rgba(255,43,43,0.8)" : "rgba(255,255,255,0.1)",
                                                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                                },
                                            }}
                                        >
                                            <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                {isSelected && (
                                                    <Box sx={{
                                                        position: "absolute", top: 10, right: 10,
                                                        width: 24, height: 24, borderRadius: "50%",
                                                        background: "rgba(255,43,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center"
                                                    }}>
                                                        <CheckCircleIcon sx={{ color: '#ff2b2b', fontSize: 18, filter: "drop-shadow(0 0 4px rgba(255,43,43,0.8))" }} />
                                                    </Box>
                                                )}

                                                <Typography variant="h3" sx={{ fontWeight: 800, color: isSelected ? '#ff2b2b' : '#fff', mb: 1.5, transition: "color 0.3s" }}>
                                                    {lang.native}
                                                </Typography>

                                                <Typography sx={{ color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: "0.85rem", letterSpacing: 0.5, transition: "color 0.3s" }}>
                                                    {lang.name}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>

                    <Box sx={{ mt: 6, p: 3, borderRadius: 3, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderLeft: "4px solid #ff2b2b", display: "flex", gap: 2, alignItems: "flex-start" }}>
                        <InfoIcon sx={{ color: "#ff2b2b", mt: 0.3 }} />
                        <Box>
                            <Typography sx={{ color: '#fff', fontWeight: 800, mb: 0.5, letterSpacing: 0.5 }}>
                                {t('note') || 'Automatic Translation Info'}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: "0.85rem", lineHeight: 1.6 }}>
                                {t('languageNoteMessage') || 'Your language preference is saved automatically and will fully persist across all your login sessions. Real-Hero automatically live-translates your dashboard immediately upon selection without requiring a page refresh.'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
