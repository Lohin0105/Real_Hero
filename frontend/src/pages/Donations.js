// frontend/src/pages/Donations.js
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import StarIcon from "@mui/icons-material/Star";
import { authUtils } from "../utils/auth";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

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

function InfoRow({ icon, label, value, highlight }) {
    if (!value) return null;
    return (
        <Grid item xs={12} sm={6}>
            <Box sx={{ background: "rgba(255,255,255,0.04)", borderRadius: 2, p: 2, border: "1px solid rgba(255,255,255,0.06)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box sx={{ color: "#ff4a4a", fontSize: 15, display: "flex" }}>{icon}</Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{label}</Typography>
                </Box>
                <Typography sx={{ color: highlight || "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{value}</Typography>
            </Box>
        </Grid>
    );
}

export default function Donations() {
    const { t } = useTranslation();
    const isMobile = useMediaQuery("(max-width:900px)");
    const navigate = useNavigate();

    const [openSidebar, setOpenSidebar] = useState(false);
    const [tab, setTab] = useState(0); // 0 = Active, 1 = History
    const [liveDonation, setLiveDonation] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    // Dialogs
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [completeOpen, setCompleteOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const h = authUtils.getAuthHeaders();
            const [uRes, dRes] = await Promise.all([
                fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers: h }),
                fetch(`${API_BASE}/api/requests/my-donations`, { headers: h }),
            ]);
            let currentUser = null;
            if (uRes.ok) { currentUser = await uRes.json(); setUser(currentUser); }

            if (dRes.ok) {
                const data = await dRes.json();
                const active = data.find(d =>
                    ['active', 'promoted'].includes(d.status) &&
                    d.requestId &&
                    ['primary_assigned', 'backup_assigned', 'open'].includes(d.requestId.status)
                );
                if (active) {
                    setLiveDonation({
                        ...active,
                        hospital: active.requestId.hospital,
                        patientName: active.requestId.name,
                        bloodGroup: active.requestId.bloodGroup,
                        urgency: active.requestId.urgency,
                        roleLabel: active.role === 'primary' ? t('primaryDonor') || 'Primary Donor' : t('backupDonor') || 'Backup Donor',
                    });
                } else {
                    setLiveDonation(null);
                }
                const hist = data
                    .filter(d => !active || d._id !== active._id)
                    .map(d => ({
                        ...d,
                        hospital: d.requestId?.hospital || d.hospital || 'Unknown',
                        patientName: d.requestId?.name || '—',
                        bloodGroup: d.requestId?.bloodGroup || '—',
                        date: new Date(d.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                        points: d.rewardPoints || 0,
                    }));
                setHistoryList(hist);
            }
        } catch (e) { console.warn("Load error", e); }
        setLoading(false);
    }, [t]);

    useEffect(() => {
        load();
        window.addEventListener('auth-changed', load);
        window.addEventListener('user-updated', load);
        return () => { window.removeEventListener('auth-changed', load); window.removeEventListener('user-updated', load); };
    }, [load]);

    const confirmComplete = async () => {
        if (!liveDonation) return;
        try {
            const res = await fetch(`${API_BASE}/api/requests/complete/${liveDonation.requestId._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeaders() },
                body: JSON.stringify({ uid: user?.uid })
            });
            if (res.ok) { setSuccessOpen(true); load(); }
            else { const e = await res.json(); alert("Failed: " + (e.error || "Unknown error")); }
        } catch { alert("Network error"); }
        setCompleteOpen(false);
    };

    const confirmCancel = async () => {
        if (!liveDonation) return;
        try {
            const res = await fetch(`${API_BASE}/api/requests/cancel/${liveDonation.requestId._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeaders() },
                body: JSON.stringify({ uid: user?.uid })
            });
            if (res.ok) { load(); }
            else { const e = await res.json(); alert("Failed: " + (e.error || "Unknown error")); }
        } catch { alert("Network error"); }
        setCancelOpen(false);
    };

    const totalDonations = (liveDonation ? 1 : 0) + historyList.length;
    const completedCount = historyList.filter(h => h.status === 'completed').length;
    const totalPoints = historyList.reduce((sum, h) => sum + (h.points || 0), 0);

    const initials = (n) => n ? n.split(" ").map(x => x[0]).join("").toUpperCase().slice(0, 2) : "U";

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg,#080808 0%,#0f0f0f 50%,#080c13 100%)", color: "#fff", fontFamily: "'Poppins',sans-serif" }}>

            {/* ═══ TOP NAV ═══ */}
            <Box sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                px: { xs: 2, md: 6 }, py: 2,
                borderBottom: "1px solid rgba(255,43,43,0.08)",
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
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "#fff" } }}>
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
                            <Typography variant="caption" sx={{ color: "#666" }}>{user?.email}</Typography>
                        </Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }} sx={{ gap: 1, color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                            <AccountCircleIcon fontSize="small" /> {t('profile') || 'Profile'}
                        </MenuItem>
                        <MenuItem onClick={() => window.location.href = "/"} sx={{ gap: 1, color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                            <LogoutIcon fontSize="small" /> {t('logout') || 'Logout'}
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* ═══ BODY ═══ */}
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
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, background: "linear-gradient(90deg,#42a5f5,#90caf9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            My Donations
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: "0.88rem" }}>
                            Track your active donation mission and full donation history
                        </Typography>
                    </Box>

                    {/* Stats */}
                    {!loading && totalDonations > 0 && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {[
                                { label: "Total", value: totalDonations, color: "#42a5f5", icon: <VolunteerActivismIcon /> },
                                { label: "Active", value: liveDonation ? 1 : 0, color: "#ff9800", icon: <RadioButtonCheckedIcon /> },
                                { label: "Completed", value: completedCount, color: "#4caf50", icon: <CheckCircleIcon /> },
                                { label: "Hero Points", value: totalPoints, color: "#ffd54f", icon: <StarIcon /> },
                            ].map(s => (
                                <Grid item xs={6} sm={3} key={s.label}>
                                    <Box sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, p: { xs: 1.5, md: 2.5 }, textAlign: "center", "&:hover": { background: "rgba(255,255,255,0.06)", borderColor: `${s.color}44`, transform: "translateY(-2px)" }, transition: "0.25s" }}>
                                        <Box sx={{ color: s.color, mb: 0.5, display: "flex", justifyContent: "center" }}>{s.icon}</Box>
                                        <Typography sx={{ fontSize: { xs: "1.4rem", md: "2rem" }, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                                        <Typography sx={{ fontSize: { xs: "0.62rem", md: "0.72rem" }, color: "rgba(255,255,255,0.38)", mt: 0.5, fontWeight: 500 }}>{s.label}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* Tabs */}
                    <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", mb: 3 }}>
                        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
                            TabIndicatorProps={{ style: { background: "#42a5f5", height: 3, borderRadius: 2 } }}>
                            <Tab icon={<RadioButtonCheckedIcon sx={{ fontSize: 15 }} />} iconPosition="start"
                                label={`Active Mission (${liveDonation ? 1 : 0})`}
                                sx={{ color: tab === 0 ? "#42a5f5" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.82rem", textTransform: "none", minHeight: 48, gap: 0.5 }} />
                            <Tab icon={<HistoryIcon sx={{ fontSize: 15 }} />} iconPosition="start"
                                label={`History (${historyList.length})`}
                                sx={{ color: tab === 1 ? "#4caf50" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.82rem", textTransform: "none", minHeight: 48, gap: 0.5 }} />
                        </Tabs>
                    </Box>

                    {/* Content */}
                    {loading ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 12, gap: 2 }}>
                            <CircularProgress size={44} sx={{ color: "#ff2b2b" }} />
                            <Typography sx={{ color: "rgba(255,255,255,0.35)" }}>Loading your donations…</Typography>
                        </Box>
                    ) : tab === 0 ? (
                        /* ── ACTIVE TAB ── */
                        !liveDonation ? (
                            <Box sx={{ textAlign: "center", py: 10, background: "rgba(255,255,255,0.02)", borderRadius: 4, border: "1px dashed rgba(255,255,255,0.07)" }}>
                                <VolunteerActivismIcon sx={{ fontSize: 54, color: "rgba(66,165,245,0.2)", mb: 2 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "1rem", mb: 0.5 }}>No Active Mission</Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem" }}>
                                    Accept a blood donation request to see your active mission here.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{
                                background: "rgba(15,15,15,0.8)", borderRadius: 3,
                                border: "1px solid rgba(66,165,245,0.35)", backdropFilter: "blur(16px)",
                                overflow: "hidden", boxShadow: "0 0 24px rgba(66,165,245,0.12)"
                            }}>
                                <Box sx={{ height: 3, background: "linear-gradient(90deg,#42a5f5,#1565c0,transparent)" }} />
                                <Box sx={{ p: { xs: 2.5, md: 4 } }}>
                                    {/* Mission header */}
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 3 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                                            <BloodBadge group={liveDonation.bloodGroup} />
                                            <Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                                                    <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "1.05rem" }}>
                                                        Donating {liveDonation.bloodGroup} Blood
                                                    </Typography>
                                                    <Chip label="ACTIVE MISSION" size="small"
                                                        sx={{ bgcolor: "rgba(66,165,245,0.12)", color: "#42a5f5", fontWeight: 800, fontSize: "0.6rem", height: 19, border: "1px solid rgba(66,165,245,0.3)", borderRadius: 1 }} />
                                                    <Chip label={liveDonation.roleLabel} size="small"
                                                        sx={{ bgcolor: "rgba(255,43,43,0.1)", color: "#ff6b6b", fontWeight: 800, fontSize: "0.6rem", height: 19, border: "1px solid rgba(255,43,43,0.25)", borderRadius: 1 }} />
                                                </Box>
                                                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <LocalHospitalIcon sx={{ fontSize: 12, color: "#ff4a4a" }} />
                                                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem" }}>{liveDonation.hospital}</Typography>
                                                    </Box>
                                                    {liveDonation.patientName && (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <PersonIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
                                                            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>Patient: {liveDonation.patientName}</Typography>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Mission card info */}
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <InfoRow icon={<LocalHospitalIcon />} label="Hospital" value={liveDonation.hospital} />
                                        <InfoRow icon={<PersonIcon />} label="Patient Name" value={liveDonation.patientName} />
                                        <InfoRow icon={<BloodtypeIcon />} label="Blood Group" value={liveDonation.bloodGroup} highlight="#ff4a4a" />
                                        <InfoRow icon={<VolunteerActivismIcon />} label="Your Role" value={liveDonation.roleLabel} highlight="#42a5f5" />
                                        {liveDonation.urgency && (
                                            <InfoRow icon={<RadioButtonCheckedIcon />} label="Urgency" value={liveDonation.urgency?.toUpperCase()} highlight="#ff9800" />
                                        )}
                                        <InfoRow icon={<AccessTimeIcon />} label="Accepted On"
                                            value={new Date(liveDonation.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
                                    </Grid>

                                    {/* Action buttons */}
                                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                        {/* Removed Start Mission Button */}
                                        <Button variant="contained" startIcon={<CheckCircleIcon />}
                                            onClick={() => setCompleteOpen(true)}
                                            sx={{
                                                borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.88rem",
                                                background: "linear-gradient(135deg,#2e7d32,#1b5e20)",
                                                boxShadow: "0 4px 20px rgba(46,125,50,0.35)",
                                                marginLeft: "auto",
                                                "&:hover": { background: "linear-gradient(135deg,#388e3c,#2e7d32)", boxShadow: "0 6px 28px rgba(46,125,50,0.5)" }
                                            }}>
                                            Mission Accomplished ✓
                                        </Button>
                                        <Button variant="outlined" startIcon={<CancelIcon />}
                                            onClick={() => setCancelOpen(true)}
                                            sx={{
                                                borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.84rem",
                                                color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.12)",
                                                "&:hover": { borderColor: "rgba(255,43,43,0.5)", color: "#ff6b6b", bgcolor: "rgba(255,43,43,0.04)" }
                                            }}>
                                            Abort Mission
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        )
                    ) : (
                        /* ── HISTORY TAB ── */
                        historyList.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 10, background: "rgba(255,255,255,0.02)", borderRadius: 4, border: "1px dashed rgba(255,255,255,0.07)" }}>
                                <HistoryIcon sx={{ fontSize: 54, color: "rgba(76,175,80,0.2)", mb: 2 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "1rem", mb: 0.5 }}>No History Yet</Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.82rem" }}>Completed donations will appear here.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {historyList.map(item => (
                                    <Grid item xs={12} key={item._id}>
                                        <Box onClick={() => { setSelectedDetail(item); setDetailOpen(true); }}
                                            sx={{
                                                background: "rgba(15,15,15,0.7)", borderRadius: 3,
                                                border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)",
                                                overflow: "hidden", transition: "all 0.25s", cursor: "pointer",
                                                "&:hover": { transform: "translateY(-2px)", borderColor: "rgba(66,165,245,0.3)", boxShadow: "0 6px 24px rgba(66,165,245,0.08)" }
                                            }}>
                                            <Box sx={{ height: 2, background: item.status === 'completed' ? "linear-gradient(90deg,#4caf50,transparent)" : "linear-gradient(90deg,#ff9800,transparent)" }} />
                                            <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                                                    <BloodBadge group={item.bloodGroup} />
                                                    <Box>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                            <Typography sx={{ fontWeight: 800, color: "#ddd", fontSize: "0.97rem" }}>
                                                                {item.bloodGroup} Donation
                                                            </Typography>
                                                            <Chip
                                                                label={item.status?.toUpperCase() || "COMPLETED"}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: item.status === 'completed' ? "rgba(76,175,80,0.1)" : "rgba(255,152,0,0.1)",
                                                                    color: item.status === 'completed' ? "#66bb6a" : "#ff9800",
                                                                    fontWeight: 800, fontSize: "0.6rem", height: 19,
                                                                    border: `1px solid ${item.status === 'completed' ? "rgba(76,175,80,0.25)" : "rgba(255,152,0,0.25)"}`,
                                                                    borderRadius: 1
                                                                }} />
                                                        </Box>
                                                        <Stack direction="row" spacing={2}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <LocalHospitalIcon sx={{ fontSize: 12, color: "#ff4a4a" }} />
                                                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>{item.hospital}</Typography>
                                                            </Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <AccessTimeIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }} />
                                                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.73rem" }}>{item.date}</Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {item.points > 0 && (
                                                        <Chip icon={<EmojiEventsIcon style={{ fontSize: 13, color: "#ffd54f" }} />}
                                                            label={`+${item.points} pts`} size="small"
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

            {/* ═══ DETAIL DIALOG ═══ */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg,#111 0%,#0a0f1a 100%)", border: "1px solid rgba(66,165,245,0.18)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <VolunteerActivismIcon sx={{ color: "#42a5f5" }} />
                        <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem" }}>Donation Details</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setDetailOpen(false)} sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedDetail && (
                        <Grid container spacing={2}>
                            <InfoRow icon={<LocalHospitalIcon />} label="Hospital" value={selectedDetail.hospital} />
                            <InfoRow icon={<PersonIcon />} label="Patient Name" value={selectedDetail.patientName} />
                            <InfoRow icon={<BloodtypeIcon />} label="Blood Group" value={selectedDetail.bloodGroup} highlight="#ff4a4a" />
                            <InfoRow icon={<VolunteerActivismIcon />} label="Your Role" value={selectedDetail.role?.charAt(0).toUpperCase() + selectedDetail.role?.slice(1) || "Donor"} highlight="#42a5f5" />
                            <InfoRow icon={<CheckCircleIcon />} label="Status" value={selectedDetail.status?.toUpperCase()} highlight={selectedDetail.status === 'completed' ? "#4caf50" : "#ff9800"} />
                            <InfoRow icon={<AccessTimeIcon />} label="Date" value={selectedDetail.date} />
                            {selectedDetail.points > 0 && (
                                <Grid item xs={12}>
                                    <Box sx={{ background: "rgba(255,213,79,0.07)", borderRadius: 2, p: 2.5, border: "1px solid rgba(255,213,79,0.18)", display: "flex", alignItems: "center", gap: 2 }}>
                                        <EmojiEventsIcon sx={{ color: "#ffd54f", fontSize: 36 }} />
                                        <Box>
                                            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.67rem", textTransform: "uppercase", letterSpacing: 1, mb: 0.3 }}>Rewards Earned</Typography>
                                            <Typography sx={{ color: "#ffd54f", fontWeight: 800, fontSize: "1.2rem" }}>+{selectedDetail.points} Hero Points</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}
                            {!(selectedDetail.points > 0) && selectedDetail.status !== 'cancelled' && (
                                <Grid item xs={12}>
                                    <Box sx={{ background: "rgba(255,255,255,0.02)", borderRadius: 2, p: 2, border: "1px dashed rgba(255,255,255,0.08)", textAlign: "center" }}>
                                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                                            🕐 Rewards will be credited after the requester confirms receipt.
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid rgba(255,255,255,0.06)", pt: 2 }}>
                    <Button onClick={() => setDetailOpen(false)} variant="outlined"
                        sx={{ color: "rgba(255,255,255,0.65)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "#fff" } }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ COMPLETE CONFIRM DIALOG ═══ */}
            <Dialog open={completeOpen} onClose={() => setCompleteOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg,#111,#0a1a0a)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2 }}>
                    <CheckCircleIcon sx={{ color: "#4caf50" }} />
                    <Typography sx={{ fontWeight: 700 }}>Confirm Mission Complete?</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                        Confirming this will mark your donation as <b>complete</b>, remove you from the active mission, and add it to your donation history. Hero Points will be credited after the requester confirms.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid rgba(255,255,255,0.06)", pt: 2 }}>
                    <Button onClick={() => setCompleteOpen(false)} variant="outlined"
                        sx={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "#fff" } }}>
                        Cancel
                    </Button>
                    <Button onClick={confirmComplete} variant="contained" startIcon={<CheckCircleIcon />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg,#2e7d32,#1b5e20)", boxShadow: "0 2px 16px rgba(46,125,50,0.4)", "&:hover": { background: "linear-gradient(135deg,#388e3c,#2e7d32)" } }}>
                        YES — Mission Complete ✓
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ CANCEL CONFIRM DIALOG ═══ */}
            <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg,#111,#1a0a0a)", border: "1px solid rgba(255,43,43,0.2)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2 }}>
                    <CancelIcon sx={{ color: "#ff4a4a" }} />
                    <Typography sx={{ fontWeight: 700 }}>Abort Mission?</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                        This will cancel your donation commitment. The requester will be notified and may look for another donor. Are you sure?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid rgba(255,255,255,0.06)", pt: 2 }}>
                    <Button onClick={() => setCancelOpen(false)} variant="outlined"
                        sx={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "#fff" } }}>
                        No — Stay in Mission
                    </Button>
                    <Button onClick={confirmCancel} variant="contained" startIcon={<CancelIcon />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg,#c62828,#7f0000)", boxShadow: "0 2px 16px rgba(198,40,40,0.35)", "&:hover": { background: "linear-gradient(135deg,#d32f2f,#c62828)" } }}>
                        YES — Abort Mission
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ SUCCESS DIALOG ═══ */}
            <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg,#0a1a0a,#111)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 3, color: "#fff", textAlign: "center" } }}>
                <DialogContent sx={{ pt: 4, pb: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 60, color: "#4caf50", mb: 2 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", mb: 1 }}>Mission Complete! 🎉</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem" }}>
                        Thank you for saving a life! Your donation has been recorded. Hero Points will be credited once the requester confirms receipt.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button onClick={() => setSuccessOpen(false)} variant="contained"
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 4, background: "linear-gradient(135deg,#2e7d32,#1b5e20)", "&:hover": { background: "linear-gradient(135deg,#388e3c,#2e7d32)" } }}>
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
