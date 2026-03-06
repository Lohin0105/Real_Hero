// frontend/src/pages/RequestedDonations.js
import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Typography, Button, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, Drawer, IconButton, useMediaQuery,
    Avatar, Menu, MenuItem, Divider, Grid, Stack, Chip, Tabs, Tab
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useNavigate } from 'react-router-dom';
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import { authUtils } from "../utils/auth";
import { useTranslation } from 'react-i18next';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const urgencyColors = {
    critical: { bg: "rgba(255,43,43,0.15)", border: "rgba(255,43,43,0.5)", text: "#ff4a4a", glow: "0 0 12px rgba(255,43,43,0.3)" },
    high: { bg: "rgba(255,152,0,0.12)", border: "rgba(255,152,0,0.4)", text: "#ff9800", glow: "0 0 12px rgba(255,152,0,0.2)" },
    medium: { bg: "rgba(33,150,243,0.1)", border: "rgba(33,150,243,0.3)", text: "#42a5f5", glow: "0 0 12px rgba(33,150,243,0.15)" },
    low: { bg: "rgba(76,175,80,0.1)", border: "rgba(76,175,80,0.3)", text: "#66bb6a", glow: "none" },
};

const bloodColors = ["#ff4a4a", "#ff7043", "#ff6b35", "#ffa726", "#ab47bc", "#42a5f5", "#26a69a", "#66bb6a"];
function BloodBadge({ group }) {
    const idx = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].indexOf(group);
    const c = bloodColors[idx] || "#ff4a4a";
    return (
        <Box sx={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: `radial-gradient(circle, ${c}22, ${c}08)`, border: `2px solid ${c}66`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 18px ${c}33`
        }}>
            <BloodtypeIcon sx={{ color: c, fontSize: 15, mb: "-2px" }} />
            <Typography sx={{ color: c, fontSize: "0.68rem", fontWeight: 900, lineHeight: 1 }}>{group}</Typography>
        </Box>
    );
}

// Reusable info row for detail modals
function InfoRow({ icon, label, value, highlight }) {
    return value ? (
        <Grid item xs={12} sm={6}>
            <Box sx={{ background: "rgba(255,255,255,0.04)", borderRadius: 2, p: 2, border: "1px solid rgba(255,255,255,0.06)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box sx={{ color: "#ff4a4a", fontSize: 15, display: "flex" }}>{icon}</Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{label}</Typography>
                </Box>
                <Typography sx={{ color: highlight || "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{value}</Typography>
            </Box>
        </Grid>
    ) : null;
}

export default function RequestedDonations() {
    const { t } = useTranslation();
    const isMobile = useMediaQuery("(max-width:900px)");
    const navigate = useNavigate();

    const [openSidebar, setOpenSidebar] = useState(false);
    const [tab, setTab] = useState(0); // 0=Active, 1=History
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    // Dialogs
    const [selectedReq, setSelectedReq] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [confirmReq, setConfirmReq] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);

    // ── FAST parallel load ──────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const h = authUtils.getAuthHeaders();
            const [uRes, rRes] = await Promise.all([
                fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers: h }),
                fetch(`${API_BASE}/api/requests/my-requests`, { headers: h }),
            ]);
            if (uRes.ok) setUser(await uRes.json());
            if (rRes.ok) setRequests(await rRes.json());
        } catch (e) { console.warn("Load error", e); }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
        const ev = () => load();
        window.addEventListener('auth-changed', ev);
        window.addEventListener('user-updated', ev);
        return () => { window.removeEventListener('auth-changed', ev); window.removeEventListener('user-updated', ev); };
    }, [load]);

    // ── Fulfillment ─────────────────────────────────────────────────────
    const confirmFulfill = async () => {
        if (!confirmReq) return;
        try {
            const res = await fetch(`${API_BASE}/api/requests/close/${confirmReq._id}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeaders() },
                body: JSON.stringify({ uid: user?.uid })
            });
            if (res.ok) { setSuccessOpen(true); load(); }
            else { const e = await res.json(); alert("Failed: " + (e.error || "Unknown error")); }
        } catch { alert("Network error"); }
        setConfirmOpen(false);
    };

    const active = requests.filter(r => ['open', 'primary_assigned', 'backup_assigned'].includes(r.status));
    const history = requests.filter(r => ['fulfilled', 'closed', 'cancelled'].includes(r.status));

    const initials = (n) => n ? n.split(" ").map(x => x[0]).join("").toUpperCase().slice(0, 2) : "U";
    const profileOpen = Boolean(anchorEl);

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg,#080808 0%,#0f0f0f 50%,#130608 100%)", color: "#fff", fontFamily: "'Poppins',sans-serif" }}>

            {/* ═══ TOP NAV ══════════════════════════════════════════════ */}
            <Box sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                px: { xs: 2, md: 6 }, py: 2, borderBottom: "1px solid rgba(255,43,43,0.08)",
                backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100,
                background: "rgba(8,8,8,0.88)"
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpenSidebar(true)}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 800, textShadow: "0 0 18px rgba(255,20,20,0.85)" }}>
                        Real-Hero
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
                        <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)", width: 38, height: 38 }}>
                            {!user?.profilePhoto && initials(user?.name)}
                        </Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "#fff" } }}>
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
                            <Typography variant="caption" sx={{ color: "#666" }}>{user?.email}</Typography>
                        </Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }} sx={{ gap: 1, color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                            <AccountCircleIcon fontSize="small" /> {t('profile')}
                        </MenuItem>
                        <MenuItem onClick={() => window.location.href = "/"} sx={{ gap: 1, color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                            <LogoutIcon fontSize="small" /> {t('logout')}
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* ═══ BODY ═════════════════════════════════════════════════ */}
            <Box sx={{ display: "flex", gap: 3, px: { xs: 0, md: 3 }, py: { xs: 2, md: 3 } }}>
                {!isMobile && <Box sx={{ width: 260, flexShrink: 0 }}><Sidebar /></Box>}
                {isMobile && (
                    <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)}
                        sx={{ "& .MuiDrawer-paper": { width: 260, background: "#0b0b0b", borderRight: "1px solid rgba(255,43,43,0.1)" } }}>
                        <Sidebar />
                    </Drawer>
                )}

                <Box sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 0 }, pr: { md: 3 } }}>

                    {/* Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, background: "linear-gradient(90deg,#ff4a4a,#ff8a8a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            My Blood Requests
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: "0.88rem" }}>
                            Track and manage all your blood donation requests
                        </Typography>
                    </Box>

                    {/* Stats */}
                    {!loading && requests.length > 0 && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {[
                                { label: "Total", value: requests.length, color: "#ff4a4a", icon: <BloodtypeIcon /> },
                                { label: "Active", value: active.length, color: "#ff9800", icon: <WarningAmberIcon /> },
                                { label: "Fulfilled", value: history.length, color: "#4caf50", icon: <CheckCircleIcon /> },
                            ].map(s => (
                                <Grid item xs={4} key={s.label}>
                                    <Box sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, p: { xs: 1.5, md: 2.5 }, textAlign: "center", "&:hover": { background: "rgba(255,255,255,0.06)", borderColor: `${s.color}44`, transform: "translateY(-2px)" }, transition: "0.25s" }}>
                                        <Box sx={{ color: s.color, mb: 0.5, display: "flex", justifyContent: "center" }}>{s.icon}</Box>
                                        <Typography sx={{ fontSize: { xs: "1.4rem", md: "2rem" }, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                                        <Typography sx={{ fontSize: { xs: "0.62rem", md: "0.72rem" }, color: "rgba(255,255,255,0.38)", mt: 0.5, fontWeight: 500 }}>{s.label}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* ── TABS ────────────────────────────────────────── */}
                    <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", mb: 3 }}>
                        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
                            TabIndicatorProps={{ style: { background: "#ff2b2b", height: 3, borderRadius: 2 } }}>
                            <Tab icon={<RadioButtonCheckedIcon sx={{ fontSize: 15 }} />} iconPosition="start"
                                label={`Active Requests (${active.length})`}
                                sx={{ color: tab === 0 ? "#ff4a4a" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.82rem", textTransform: "none", minHeight: 48, gap: 0.5 }} />
                            <Tab icon={<HistoryIcon sx={{ fontSize: 15 }} />} iconPosition="start"
                                label={`History (${history.length})`}
                                sx={{ color: tab === 1 ? "#4caf50" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.82rem", textTransform: "none", minHeight: 48, gap: 0.5 }} />
                        </Tabs>
                    </Box>

                    {/* ── CONTENT ─────────────────────────────────────── */}
                    {loading ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 12, gap: 2 }}>
                            <CircularProgress size={44} sx={{ color: "#ff2b2b" }} />
                            <Typography sx={{ color: "rgba(255,255,255,0.35)" }}>Loading your requests…</Typography>
                        </Box>
                    ) : tab === 0 ? (
                        /* ── ACTIVE TAB ── */
                        active.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 10, background: "rgba(255,255,255,0.02)", borderRadius: 4, border: "1px dashed rgba(255,255,255,0.07)" }}>
                                <RadioButtonCheckedIcon sx={{ fontSize: 54, color: "rgba(255,152,0,0.2)", mb: 2 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "1rem", mb: 0.5 }}>No Active Requests</Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem" }}>Your active blood requests will appear here.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {active.map(req => {
                                    const uStyle = urgencyColors[req.urgency?.toLowerCase()] || urgencyColors.medium;
                                    return (
                                        <Grid item xs={12} key={req._id}>
                                            <Box sx={{
                                                background: "rgba(15,15,15,0.8)", borderRadius: 3,
                                                border: `1px solid ${uStyle.border}`, backdropFilter: "blur(16px)",
                                                overflow: "hidden", transition: "all 0.25s",
                                                boxShadow: uStyle.glow,
                                                "&:hover": { transform: "translateY(-3px)", boxShadow: uStyle.glow }
                                            }}>
                                                <Box sx={{ height: 3, background: `linear-gradient(90deg,${uStyle.text},transparent)` }} />
                                                <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                                                        <BloodBadge group={req.bloodGroup} />
                                                        <Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                                                                <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "1rem" }}>{req.bloodGroup} Blood Needed</Typography>
                                                                <Chip label="ACTIVE" size="small" sx={{ bgcolor: "rgba(76,175,80,0.12)", color: "#66bb6a", fontWeight: 800, fontSize: "0.6rem", height: 19, border: "1px solid rgba(76,175,80,0.3)", borderRadius: 1 }} />
                                                                {req.urgency && <Chip label={req.urgency.toUpperCase()} size="small" icon={<WarningAmberIcon style={{ fontSize: 10, color: uStyle.text }} />}
                                                                    sx={{ bgcolor: uStyle.bg, color: uStyle.text, fontWeight: 800, fontSize: "0.6rem", height: 19, border: `1px solid ${uStyle.border}`, borderRadius: 1 }} />}
                                                            </Box>
                                                            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                    <LocalHospitalIcon sx={{ fontSize: 12, color: "#ff4a4a" }} />
                                                                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem" }}>{req.hospital}</Typography>
                                                                </Box>
                                                                {req.name && <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                    <PersonIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
                                                                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>{req.name}</Typography>
                                                                </Box>}
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                    <AccessTimeIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
                                                                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>
                                                                        {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
                                                        <Button variant="outlined" size="small" startIcon={<InfoIcon />}
                                                            onClick={() => { setSelectedReq(req); setDetailOpen(true); }}
                                                            sx={{ color: "rgba(255,255,255,0.65)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.78rem", "&:hover": { borderColor: "rgba(255,255,255,0.4)", color: "#fff", bgcolor: "rgba(255,255,255,0.04)" } }}>
                                                            Details
                                                        </Button>
                                                        <Button variant="contained" size="small" startIcon={<CheckCircleIcon />}
                                                            onClick={() => { setConfirmReq(req); setConfirmOpen(true); }}
                                                            sx={{
                                                                borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.78rem",
                                                                background: "linear-gradient(135deg,#2e7d32,#1b5e20)",
                                                                boxShadow: "0 2px 12px rgba(46,125,50,0.3)",
                                                                "&:hover": { background: "linear-gradient(135deg,#388e3c,#2e7d32)", boxShadow: "0 4px 20px rgba(46,125,50,0.5)" }
                                                            }}>
                                                            Got Blood ✓
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )
                    ) : (
                        /* ── HISTORY TAB ── */
                        history.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 10, background: "rgba(255,255,255,0.02)", borderRadius: 4, border: "1px dashed rgba(255,255,255,0.07)" }}>
                                <HistoryIcon sx={{ fontSize: 54, color: "rgba(76,175,80,0.2)", mb: 2 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "1rem", mb: 0.5 }}>No History Yet</Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem" }}>Fulfilled and closed requests will appear here.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {history.map(req => (
                                    <Grid item xs={12} key={req._id}>
                                        <Box onClick={() => { setSelectedReq(req); setDetailOpen(true); }}
                                            sx={{
                                                background: "rgba(15,15,15,0.7)", borderRadius: 3,
                                                border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)",
                                                overflow: "hidden", transition: "all 0.25s", cursor: "pointer",
                                                "&:hover": { transform: "translateY(-2px)", borderColor: "rgba(76,175,80,0.3)", boxShadow: "0 6px 24px rgba(76,175,80,0.08)" }
                                            }}>
                                            <Box sx={{ height: 2, background: "linear-gradient(90deg,#4caf50,transparent)" }} />
                                            <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                                                    <BloodBadge group={req.bloodGroup} />
                                                    <Box>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                            <Typography sx={{ fontWeight: 800, color: "#ddd", fontSize: "0.97rem" }}>{req.bloodGroup} Blood Request</Typography>
                                                            <Chip label={req.status?.toUpperCase() || "CLOSED"} size="small"
                                                                sx={{ bgcolor: "rgba(76,175,80,0.1)", color: "#66bb6a", fontWeight: 800, fontSize: "0.6rem", height: 19, border: "1px solid rgba(76,175,80,0.25)", borderRadius: 1 }} />
                                                        </Box>
                                                        <Stack direction="row" spacing={2}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <LocalHospitalIcon sx={{ fontSize: 12, color: "#ff4a4a" }} />
                                                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>{req.hospital}</Typography>
                                                            </Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <AccessTimeIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }} />
                                                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.73rem" }}>
                                                                    {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {req.rewardPoints > 0 && (
                                                        <Chip icon={<EmojiEventsIcon style={{ fontSize: 13, color: "#ffd54f" }} />}
                                                            label={`+${req.rewardPoints} pts`} size="small"
                                                            sx={{ bgcolor: "rgba(255,213,79,0.1)", color: "#ffd54f", fontWeight: 800, border: "1px solid rgba(255,213,79,0.2)", borderRadius: 2 }} />
                                                    )}
                                                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>Tap for details →</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )
                    )}
                </Box>
            </Box>

            {/* ═══ DETAIL DIALOG ════════════════════════════════════════ */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg,#111 0%,#1a0a0a 100%)", border: "1px solid rgba(255,43,43,0.18)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        {selectedReq?.status === "active" ? <WarningAmberIcon sx={{ color: "#ff9800" }} /> : <CheckCircleIcon sx={{ color: "#4caf50" }} />}
                        <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem" }}>
                            {selectedReq?.status === "active" ? "Active Request Details" : "Request History Details"}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setDetailOpen(false)} sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedReq && (
                        <Grid container spacing={2}>
                            <InfoRow icon={<PersonIcon />} label="Patient / Requester" value={selectedReq.name} />
                            <InfoRow icon={<LocalHospitalIcon />} label="Hospital" value={selectedReq.hospital} />
                            <InfoRow icon={<BloodtypeIcon />} label="Blood Group Needed" value={selectedReq.bloodGroup} highlight="#ff4a4a" />
                            <InfoRow icon={<WarningAmberIcon />} label="Urgency" value={selectedReq.urgency?.toUpperCase()} />
                            <InfoRow icon={<CheckCircleIcon />} label="Status" value={selectedReq.status?.toUpperCase()} highlight={selectedReq.status === "active" ? "#ff9800" : "#4caf50"} />
                            <InfoRow icon={<AccessTimeIcon />} label="Requested On" value={new Date(selectedReq.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />

                            {/* Donor Info (if fulfilled) */}
                            {selectedReq.donorName && (
                                <InfoRow icon={<VolunteerActivismIcon />} label="Donated By" value={selectedReq.donorName} highlight="#42a5f5" />
                            )}
                            {selectedReq.donorBloodGroup && (
                                <InfoRow icon={<BloodtypeIcon />} label="Donor Blood Group" value={selectedReq.donorBloodGroup} />
                            )}
                            {selectedReq.donorPhone && (
                                <InfoRow icon={<PersonIcon />} label="Donor Contact" value={selectedReq.donorPhone} />
                            )}

                            {/* Rewards */}
                            {selectedReq.rewardPoints > 0 && (
                                <Grid item xs={12}>
                                    <Box sx={{ background: "rgba(255,213,79,0.07)", borderRadius: 2, p: 2, border: "1px solid rgba(255,213,79,0.18)", display: "flex", alignItems: "center", gap: 2 }}>
                                        <EmojiEventsIcon sx={{ color: "#ffd54f", fontSize: 32 }} />
                                        <Box>
                                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1 }}>Rewards Earned</Typography>
                                            <Typography sx={{ color: "#ffd54f", fontWeight: 800, fontSize: "1.15rem" }}>+{selectedReq.rewardPoints} Hero Points</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}

                            {/* Description */}
                            {selectedReq.description && (
                                <Grid item xs={12}>
                                    <Box sx={{ background: "rgba(255,43,43,0.05)", borderRadius: 2, p: 2, border: "1px solid rgba(255,43,43,0.12)" }}>
                                        <Typography sx={{ color: "rgba(255,255,255,0.32)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1, mb: 0.5 }}>Additional Notes</Typography>
                                        <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: "0.87rem", fontStyle: "italic" }}>{selectedReq.description}</Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid rgba(255,255,255,0.06)", pt: 2, gap: 1 }}>
                    <Button onClick={() => setDetailOpen(false)} variant="outlined"
                        sx={{ color: "rgba(255,255,255,0.65)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "#fff" } }}>
                        Close
                    </Button>
                    {selectedReq?.status === "active" && (
                        <Button variant="contained" startIcon={<CheckCircleIcon />}
                            onClick={() => { setDetailOpen(false); setConfirmReq(selectedReq); setConfirmOpen(true); }}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg,#2e7d32,#1b5e20)", "&:hover": { background: "linear-gradient(135deg,#388e3c,#2e7d32)" } }}>
                            Mark as Fulfilled
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* ═══ CONFIRM FULFILL DIALOG ═══════════════════════════════ */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg,#111,#0a1a0a)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2 }}>
                    <CheckCircleIcon sx={{ color: "#4caf50" }} />
                    <Typography sx={{ fontWeight: 700 }}>Is the Fulfillment Done?</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                        If you click <b>YES</b>, we will remove this active blood request from our public database and add it to your History of Requested Donations. If you click <b>NO</b>, your request will remain active — no need to change anything!
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid rgba(255,255,255,0.06)", pt: 2 }}>
                    <Button onClick={() => setConfirmOpen(false)} variant="outlined" sx={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "#fff" } }}>
                        NO — Cancel
                    </Button>
                    <Button onClick={confirmFulfill} variant="contained" startIcon={<CheckCircleIcon />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg,#2e7d32,#1b5e20)", boxShadow: "0 2px 16px rgba(46,125,50,0.4)", "&:hover": { background: "linear-gradient(135deg,#388e3c,#2e7d32)" } }}>
                        YES — It's Done ✓
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ SUCCESS DIALOG ════════════════════════════════════════ */}
            <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg,#0a1a0a,#111)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 3, color: "#fff", textAlign: "center" } }}>
                <DialogContent sx={{ pt: 4, pb: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 60, color: "#4caf50", mb: 2 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", mb: 1 }}>Request Closed! 🎉</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem" }}>
                        Your blood request has been fulfilled. Thank you for your bravery. Check your Rewards page for Hero Points!
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button onClick={() => setSuccessOpen(false)} variant="contained" sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 4, background: "linear-gradient(135deg,#2e7d32,#1b5e20)", "&:hover": { background: "linear-gradient(135deg,#388e3c,#2e7d32)" } }}>
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
