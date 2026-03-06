import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, CircularProgress, Drawer, IconButton, useMediaQuery,
    Avatar, Menu, MenuItem, Divider, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, Chip, Grid, Tab, Tabs,
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useNavigate } from 'react-router-dom';
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import RedeemIcon from "@mui/icons-material/Redeem";
import HistoryIcon from "@mui/icons-material/History";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import { authUtils } from "../utils/auth";

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const CATEGORY_STYLES = {
    healthcare: { color: "#42a5f5", bg: "rgba(33,150,243,0.1)", border: "rgba(33,150,243,0.3)", label: "Healthcare" },
    pharmacy: { color: "#ab47bc", bg: "rgba(171,71,188,0.1)", border: "rgba(171,71,188,0.3)", label: "Pharmacy" },
    emergency: { color: "#ff4a4a", bg: "rgba(255,43,43,0.1)", border: "rgba(255,43,43,0.3)", label: "Emergency" },
    charity: { color: "#66bb6a", bg: "rgba(76,175,80,0.1)", border: "rgba(76,175,80,0.3)", label: "Charity" },
};

// What happens after each category is redeemed
const FULFILLMENT_INFO = {
    healthcare: {
        icon: "📧",
        title: "We'll contact you via email",
        desc: "Our team will email you within 48 hours with partner lab details and how to book your appointment. Show your redemption code when visiting.",
    },
    pharmacy: {
        icon: "📧",
        title: "Voucher sent to your email",
        desc: "A pharmacy voucher code will be emailed to you within 24 hours. Present it at any partnered pharmacy counter.",
    },
    emergency: {
        icon: "⚡",
        title: "Automatically applied",
        desc: "Your next blood request will be automatically flagged as Priority and broadcast to 3× more donors. No further action needed.",
    },
    charity: {
        icon: "🤝",
        title: "Donation confirmed",
        desc: "50 coins have been donated on your behalf to a blood donation awareness NGO. A confirmation receipt will be sent to your email.",
    },
};

const EARN_ACTIONS = [
    { emoji: "🩸", title: "Donate Blood (Primary)", coins: 50, xp: 10, desc: "Complete a verified primary blood donation at a hospital." },
    { emoji: "🛡️", title: "Backup Donor Willingness", coins: 10, xp: 2, desc: "Commit as a backup donor for a blood request." },
    { emoji: "🏥", title: "Blood Request Fulfilled", coins: 20, xp: 3, desc: "Your blood request gets fulfilled (for requesters)." },
    { emoji: "📋", title: "Health Checkup (Coming Soon)", coins: 30, xp: 5, desc: "Complete a health eligibility checkup with a partner lab.", soon: true },
    { emoji: "👥", title: "Refer a Donor (Coming Soon)", coins: 25, xp: 4, desc: "Refer a friend who signs up and donates blood.", soon: true },
    { emoji: "🏕️", title: "Donation Camp (Coming Soon)", coins: 40, xp: 8, desc: "Participate in an official blood donation camp.", soon: true },
];

function StatCard({ icon, label, value, accent }) {
    return (
        <Box sx={{
            flex: 1, minWidth: 140, p: { xs: 2, md: 3 }, borderRadius: 3,
            background: `rgba(${accent}, 0.05)`, border: `1px solid rgba(${accent}, 0.18)`,
            backdropFilter: "blur(12px)", position: "relative", overflow: "hidden",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": { transform: "translateY(-4px)", boxShadow: `0 12px 40px rgba(${accent}, 0.2)` },
        }}>
            <Typography sx={{ color: `rgb(${accent})`, fontWeight: 800, mb: 0.5, letterSpacing: 1, fontSize: 10, textTransform: "uppercase" }}>{label}</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: { xs: "1.8rem", md: "2.4rem" }, lineHeight: 1 }}>{value}</Typography>
            <Box sx={{ position: "absolute", right: -12, bottom: -12, opacity: 0.07 }}>{icon}</Box>
        </Box>
    );
}

export default function Rewards() {
    const { t } = useTranslation();
    const [openSidebar, setOpenSidebar] = useState(false);
    const isMobile = useMediaQuery("(max-width:900px)");
    const [user, setUser] = useState(null);
    const [rewardLogs, setRewardLogs] = useState([]);
    const [redeemOptions, setRedeemOptions] = useState([]);
    const [redeemHistory, setRedeemHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const profileOpen = Boolean(anchorEl);
    const [activeTab, setActiveTab] = useState(0);
    const [historyTab, setHistoryTab] = useState('earned');
    const navigate = useNavigate();

    // Redeem flow state
    const [selectedOption, setSelectedOption] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [redeeming, setRedeeming] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [successOpen, setSuccessOpen] = useState(false);

    // Earn details dialog
    const [selectedLog, setSelectedLog] = useState(null);
    const [logDialogOpen, setLogDialogOpen] = useState(false);

    async function loadAll() {
        setLoading(true);
        try {
            const headers = authUtils.getAuthHeaders();
            const [userRes, logsRes, optionsRes, histRes] = await Promise.all([
                fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers }),
                fetch(`${API_BASE}/api/rewards/my-rewards`, { headers }),
                fetch(`${API_BASE}/api/redeem/options`),
                fetch(`${API_BASE}/api/redeem/history`, { headers }),
            ]);
            if (userRes.ok) setUser(await userRes.json());
            if (logsRes.ok) setRewardLogs(await logsRes.json());
            if (optionsRes.ok) setRedeemOptions(await optionsRes.json());
            if (histRes.ok) setRedeemHistory(await histRes.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    useEffect(() => {
        loadAll();
        const handler = () => loadAll();
        try { window.addEventListener('auth-changed', handler); window.addEventListener('user-updated', handler); } catch (e) { }
        return () => { try { window.removeEventListener('auth-changed', handler); window.removeEventListener('user-updated', handler); } catch (e) { } };
    }, []);

    const totalCoins = user?.coins || 0;
    const totalXP = user?.leaderboardPoints || 0;
    const redeemedCoins = user?.redeemedCoins || 0;

    const handleRedeem = async () => {
        if (!selectedOption) return;
        setRedeeming(true);
        try {
            const res = await fetch(`${API_BASE}/api/redeem/redeem`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authUtils.getAuthHeaders() },
                body: JSON.stringify({ optionId: selectedOption._id }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccessData(data);
                setConfirmOpen(false);
                setSuccessOpen(true);
                await loadAll();
            } else {
                alert(data.error || "Redemption failed");
                setConfirmOpen(false);
            }
        } catch (e) { alert("Network error"); }
        setRedeeming(false);
    };

    const canAfford = (cost) => totalCoins >= cost;

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg, #080808 0%, #0f0f0f 50%, #0a0510 100%)", color: "#fff", fontFamily: "'Poppins', sans-serif" }}>

            {/* TOP NAV */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2, md: 6 }, py: 2, borderBottom: "1px solid rgba(255,215,0,0.08)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, background: "rgba(8,8,8,0.85)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpenSidebar(true)}><MenuIcon /></IconButton>
                    <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 800, textShadow: "0 0 18px rgba(255,20,20,0.85)" }}>Real-Hero</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Chip icon={<MonetizationOnIcon sx={{ color: "#ffd700 !important", fontSize: 16 }} />} label={`${totalCoins} Coins`} size="small"
                        sx={{ bgcolor: "rgba(255,215,0,0.1)", color: "#ffd700", fontWeight: 800, border: "1px solid rgba(255,215,0,0.3)", borderRadius: 2 }} />
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)", width: 36, height: 36, fontSize: "0.85rem", fontWeight: 700 }}>
                            {!user?.profilePhoto && user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "#fff" } }}>
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
                            <Typography variant="caption" sx={{ color: "#777" }}>{user?.email}</Typography>
                        </Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }} sx={{ color: "rgba(255,255,255,0.8)", gap: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                            <AccountCircleIcon fontSize="small" /> Profile
                        </MenuItem>
                        <MenuItem onClick={() => { authUtils.logout(); window.location.href = "/"; }} sx={{ color: "rgba(255,255,255,0.8)", gap: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                            <LogoutIcon fontSize="small" /> Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 3, px: { xs: 0, md: 3 }, py: { xs: 2, md: 3 } }}>
                {!isMobile && <Box sx={{ width: 260, flexShrink: 0 }}><Sidebar /></Box>}
                {isMobile && (
                    <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)} sx={{ "& .MuiDrawer-paper": { width: 260, background: "#0b0b0b", borderRight: "1px solid rgba(255,43,43,0.1)" } }}>
                        <Sidebar />
                    </Drawer>
                )}

                <Box sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 0 }, pr: { md: 3 } }}>

                    {/* Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, background: "linear-gradient(90deg, #ffd700, #ffb300)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Impact Coins
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                            Earn coins by saving lives. Redeem for real healthcare benefits.
                        </Typography>
                    </Box>

                    {/* Hero Banner */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, p: { xs: 2.5, md: 4 }, mb: 3, borderRadius: 3, background: "linear-gradient(135deg, #1a1000 0%, #2d1900 60%, #1a1000 100%)", border: "1px solid rgba(255,215,0,0.25)", boxShadow: "0 8px 40px rgba(255,215,0,0.08)" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Avatar src={user?.profilePhoto} sx={{ width: 58, height: 58, bgcolor: "#ff2b2b", fontSize: "1.4rem", fontWeight: 900, border: "2px solid rgba(255,43,43,0.4)", boxShadow: "0 0 20px rgba(255,43,43,0.25)" }}>
                                {!user?.profilePhoto && user?.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: "1.15rem", color: "#fff" }}>{user?.name?.toUpperCase() || "—"}</Typography>
                                    <Chip label="YOU" size="small" sx={{ height: 18, bgcolor: "#ff2b2b", color: "#fff", fontWeight: 900, fontSize: "0.55rem" }} />
                                </Box>
                                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{user?.email}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 3 }}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography sx={{ fontSize: "2rem", fontWeight: 900, color: "#ffd700", lineHeight: 1 }}>{totalCoins}</Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>COINS AVAILABLE</Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                            <Box sx={{ textAlign: "center" }}>
                                <Typography sx={{ fontSize: "2rem", fontWeight: 900, color: "#ff4a4a", lineHeight: 1 }}>{totalXP}</Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>XP POINTS</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Stats Row */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                        <StatCard icon={<EmojiEventsIcon sx={{ fontSize: 110, color: "#ffd700" }} />} label="Coins Available" value={totalCoins} accent="255,215,0" />
                        <StatCard icon={<LeaderboardIcon sx={{ fontSize: 110, color: "#ff2b2b" }} />} label="XP Points" value={totalXP} accent="255,43,43" />
                        <StatCard icon={<RedeemIcon sx={{ fontSize: 110, color: "#ab47bc" }} />} label="Redeemed Coins" value={redeemedCoins} accent="171,71,188" />
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", mb: 3 }}>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant={isMobile ? "fullWidth" : "standard"}
                            sx={{
                                "& .MuiTab-root": { color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "none", fontSize: "0.9rem" },
                                "& .Mui-selected": { color: "#ffd700 !important" },
                                "& .MuiTabs-indicator": { backgroundColor: "#ffd700" },
                            }}>
                            <Tab icon={<MonetizationOnIcon fontSize="small" />} iconPosition="start" label="Earn Coins" />
                            <Tab icon={<RedeemIcon fontSize="small" />} iconPosition="start" label="Redeem" />
                            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="History" />
                        </Tabs>
                    </Box>

                    {/* ── TAB 0: EARN ─────────────────────────────── */}
                    {activeTab === 0 && (
                        <Box>
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", mb: 3 }}>
                                Complete these actions to earn Impact Coins. Coins are automatically credited after verification.
                            </Typography>
                            <Grid container spacing={2}>
                                {EARN_ACTIONS.map((action) => (
                                    <Grid item xs={12} sm={6} md={4} key={action.title}>
                                        <Box sx={{
                                            background: action.soon ? "rgba(255,255,255,0.02)" : "rgba(255,215,0,0.04)",
                                            border: `1px solid ${action.soon ? "rgba(255,255,255,0.06)" : "rgba(255,215,0,0.15)"}`,
                                            borderRadius: 3, p: 2.5, height: "100%",
                                            opacity: action.soon ? 0.6 : 1,
                                            transition: "0.3s", "&:hover": { transform: action.soon ? "none" : "translateY(-3px)", borderColor: action.soon ? undefined : "rgba(255,215,0,0.35)" }
                                        }}>
                                            <Box sx={{ fontSize: "2rem", mb: 1 }}>{action.emoji}</Box>
                                            <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem", mb: 0.5 }}>{action.title}</Typography>
                                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", mb: 2, lineHeight: 1.5 }}>{action.desc}</Typography>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Chip label={`+${action.coins} 🪙`} size="small" sx={{ bgcolor: "rgba(255,215,0,0.12)", color: "#ffd700", fontWeight: 800, border: "1px solid rgba(255,215,0,0.3)", borderRadius: 1 }} />
                                                <Chip label={`+${action.xp} XP`} size="small" sx={{ bgcolor: "rgba(76,175,80,0.1)", color: "#66bb6a", fontWeight: 800, border: "1px solid rgba(76,175,80,0.3)", borderRadius: 1 }} />
                                                {action.soon && <Chip label="Soon" size="small" sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontWeight: 700, borderRadius: 1 }} />}
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* ── TAB 1: REDEEM ───────────────────────────── */}
                    {activeTab === 1 && (
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
                                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                                    Redeem your coins for real healthcare benefits. Your balance: <span style={{ color: "#ffd700", fontWeight: 800 }}>{totalCoins} coins</span>
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                    {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                                        <Chip key={key} label={style.label} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, border: `1px solid ${style.border}`, borderRadius: 1, fontSize: "0.7rem" }} />
                                    ))}
                                </Box>
                            </Box>
                            {loading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#ffd700" }} /></Box>
                            ) : (
                                <Grid container spacing={2.5}>
                                    {redeemOptions.map((opt) => {
                                        const cs = CATEGORY_STYLES[opt.category] || CATEGORY_STYLES.healthcare;
                                        const affordable = canAfford(opt.coinCost);
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={opt._id}>
                                                <Box sx={{
                                                    background: "rgba(15,15,15,0.9)", borderRadius: 3, height: "100%", display: "flex", flexDirection: "column",
                                                    border: `1px solid ${affordable ? cs.border : "rgba(255,255,255,0.06)"}`,
                                                    backdropFilter: "blur(16px)", overflow: "hidden",
                                                    transition: "0.3s", opacity: affordable ? 1 : 0.65,
                                                    "&:hover": { transform: affordable ? "translateY(-4px)" : "none", boxShadow: affordable ? `0 12px 40px ${cs.bg.replace("0.1", "0.25")}` : "none" }
                                                }}>
                                                    <Box sx={{ height: 3, background: `linear-gradient(90deg, ${cs.color}, transparent)` }} />
                                                    <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
                                                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                                                            <Typography sx={{ fontSize: "2.2rem" }}>{opt.icon}</Typography>
                                                            <Chip label={cs.label} size="small" sx={{ bgcolor: cs.bg, color: cs.color, fontWeight: 700, border: `1px solid ${cs.border}`, borderRadius: 1, fontSize: "0.65rem" }} />
                                                        </Box>
                                                        <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "1rem", mb: 0.5 }}>{opt.title}</Typography>
                                                        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", mb: 2, lineHeight: 1.6, flex: 1 }}>{opt.description}</Typography>
                                                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", mb: 1.5 }}>🤝 {opt.partner}</Typography>
                                                        {/* Fulfillment note */}
                                                        <Box sx={{ background: "rgba(255,255,255,0.03)", borderRadius: 1.5, px: 1.5, py: 1, mb: 1.5, border: "1px solid rgba(255,255,255,0.05)" }}>
                                                            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", lineHeight: 1.5 }}>
                                                                {FULFILLMENT_INFO[opt.category]?.icon} {FULFILLMENT_INFO[opt.category]?.title || "We'll contact you after redemption"}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: affordable ? "#ffd700" : "rgba(255,255,255,0.3)" }}>{opt.coinCost}</Typography>
                                                                <Typography sx={{ color: affordable ? "rgba(255,215,0,0.6)" : "rgba(255,255,255,0.25)", fontSize: "0.75rem", fontWeight: 600 }}>coins</Typography>
                                                            </Box>
                                                            <Button
                                                                variant="contained" size="small" disabled={!affordable}
                                                                onClick={() => { setSelectedOption(opt); setConfirmOpen(true); }}
                                                                sx={{
                                                                    borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.8rem",
                                                                    background: affordable ? `linear-gradient(135deg, ${cs.color}, ${cs.color}bb)` : "rgba(255,255,255,0.05)",
                                                                    color: affordable ? "#fff" : "rgba(255,255,255,0.3)",
                                                                    boxShadow: affordable ? `0 2px 12px ${cs.bg}` : "none",
                                                                    "&:hover": { background: affordable ? `linear-gradient(135deg, ${cs.color}dd, ${cs.color})` : undefined },
                                                                    "&.Mui-disabled": { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)" }
                                                                }}
                                                            >
                                                                {affordable ? "Redeem" : `Need ${opt.coinCost - totalCoins} more`}
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Box>
                    )}

                    {/* ── TAB 2: HISTORY ──────────────────────────── */}
                    {activeTab === 2 && (
                        <Box>
                            {loading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#ffd700" }} /></Box>
                            ) : (
                                <>
                                    {/* History Tabs */}
                                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                                        <Button
                                            onClick={() => setHistoryTab('earned')}
                                            variant={historyTab === 'earned' ? "contained" : "outlined"}
                                            sx={{
                                                flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 700,
                                                background: historyTab === 'earned' ? "rgba(76,175,80,0.15)" : "transparent",
                                                color: historyTab === 'earned' ? "#66bb6a" : "rgba(255,255,255,0.4)",
                                                borderColor: historyTab === 'earned' ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.1)",
                                                "&:hover": { background: "rgba(76,175,80,0.25)", borderColor: "rgba(76,175,80,0.5)" }
                                            }}
                                        >
                                            ✅ Coins Earned ({rewardLogs.length})
                                        </Button>
                                        <Button
                                            onClick={() => setHistoryTab('redeemed')}
                                            variant={historyTab === 'redeemed' ? "contained" : "outlined"}
                                            sx={{
                                                flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 700,
                                                background: historyTab === 'redeemed' ? "rgba(171,71,188,0.15)" : "transparent",
                                                color: historyTab === 'redeemed' ? "#ab47bc" : "rgba(255,255,255,0.4)",
                                                borderColor: historyTab === 'redeemed' ? "rgba(171,71,188,0.4)" : "rgba(255,255,255,0.1)",
                                                "&:hover": { background: "rgba(171,71,188,0.25)", borderColor: "rgba(171,71,188,0.5)" }
                                            }}
                                        >
                                            🎁 Coins Redeemed ({redeemHistory.length})
                                        </Button>
                                    </Box>

                                    {/* Earned section */}
                                    {historyTab === 'earned' && (
                                        <Box>
                                            {rewardLogs.length === 0 ? (
                                                <Box sx={{ p: 3, textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.05)", mb: 3 }}>
                                                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>No earnings yet. Start donating blood!</Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 4 }}>
                                                    {rewardLogs.map((log, idx) => (
                                                        <Box key={log._id || idx} sx={{
                                                            display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, borderRadius: 2,
                                                            background: "rgba(76,175,80,0.04)", border: "1px solid rgba(76,175,80,0.12)",
                                                            transition: "0.2s", "&:hover": { background: "rgba(76,175,80,0.08)" }
                                                        }}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                                <Box sx={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(76,175,80,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🩸</Box>
                                                                <Box>
                                                                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                                                                        {log.type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Donation"}
                                                                    </Typography>
                                                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
                                                                        {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                                        {log.hospital && ` • ${log.hospital}`}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                                <Box sx={{ textAlign: "right" }}>
                                                                    <Typography sx={{ color: "#4caf50", fontWeight: 800, fontSize: "0.85rem" }}>+{log.leaderboardPoints || log.points || 0} XP</Typography>
                                                                    <Typography sx={{ color: "#ffd700", fontWeight: 800, fontSize: "0.8rem" }}>+{log.coins || 0} 🪙</Typography>
                                                                </Box>
                                                                <IconButton size="small" onClick={() => { setSelectedLog(log); setLogDialogOpen(true); }}
                                                                    sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#fff" } }}>
                                                                    <InfoIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {/* Redeemed section */}
                                    {historyTab === 'redeemed' && (
                                        <Box>
                                            {redeemHistory.length === 0 ? (
                                                <Box sx={{ p: 3, textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.05)" }}>
                                                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>No redemptions yet. Visit the Redeem tab!</Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                    {redeemHistory.map((r, idx) => {
                                                        const cs = CATEGORY_STYLES[r.optionCategory] || CATEGORY_STYLES.healthcare;
                                                        return (
                                                            <Box key={r._id || idx} sx={{
                                                                display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, borderRadius: 2,
                                                                background: "rgba(171,71,188,0.04)", border: "1px solid rgba(171,71,188,0.15)",
                                                                transition: "0.2s", "&:hover": { background: "rgba(171,71,188,0.08)" }
                                                            }}>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                                    <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: cs.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🎁</Box>
                                                                    <Box>
                                                                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>{r.optionTitle || "Reward"}</Typography>
                                                                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
                                                                            {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {r.optionPartner}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                                    <Box sx={{ textAlign: "right" }}>
                                                                        <Typography sx={{ color: "#ab47bc", fontWeight: 800, fontSize: "0.85rem" }}>-{r.coinsSpent} 🪙</Typography>
                                                                        <Chip label={r.status?.toUpperCase()} size="small"
                                                                            sx={{ bgcolor: r.status === "fulfilled" ? "rgba(76,175,80,0.1)" : "rgba(255,152,0,0.1)", color: r.status === "fulfilled" ? "#66bb6a" : "#ff9800", fontWeight: 700, fontSize: "0.6rem", height: 18, borderRadius: 1 }} />
                                                                    </Box>
                                                                    <Box sx={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 1.5, px: 1.5, py: 0.5 }}>
                                                                        <Typography sx={{ color: "#ffd700", fontWeight: 800, fontSize: "0.7rem", letterSpacing: 1 }}>{r.redemptionCode}</Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* ── Confirm Redeem Dialog ─────────────────────────── */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg, #111 0%, #190a25 100%)", border: "1px solid rgba(171,71,188,0.3)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <RedeemIcon sx={{ color: "#ab47bc" }} />
                        <Typography sx={{ fontWeight: 800 }}>Confirm Redemption</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setConfirmOpen(false)} sx={{ color: "rgba(255,255,255,0.4)" }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedOption && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box sx={{ background: "rgba(255,255,255,0.04)", borderRadius: 2, p: 2.5, textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>{selectedOption.icon}</Typography>
                                <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "1.1rem", mb: 0.5 }}>{selectedOption.title}</Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>{selectedOption.partner}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, background: "rgba(255,215,0,0.06)", borderRadius: 2, border: "1px solid rgba(255,215,0,0.15)" }}>
                                <Box>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1, mb: 0.3 }}>Current Balance</Typography>
                                    <Typography sx={{ color: "#ffd700", fontWeight: 900, fontSize: "1.3rem" }}>{totalCoins} 🪙</Typography>
                                </Box>
                                <Box sx={{ color: "rgba(255,255,255,0.2)", fontSize: "1.5rem", display: "flex", alignItems: "center" }}>→</Box>
                                <Box sx={{ textAlign: "right" }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1, mb: 0.3 }}>After Redeem</Typography>
                                    <Typography sx={{ color: "#ff9800", fontWeight: 900, fontSize: "1.3rem" }}>{totalCoins - selectedOption.coinCost} 🪙</Typography>
                                </Box>
                            </Box>
                            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", textAlign: "center" }}>
                                You'll receive a unique redemption code to use at partner locations.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid rgba(255,255,255,0.06)", pt: 2 }}>
                    <Button onClick={() => setConfirmOpen(false)} variant="outlined" sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none" }}>Cancel</Button>
                    <Button onClick={handleRedeem} variant="contained" disabled={redeeming}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg, #ab47bc, #7b1fa2)", boxShadow: "0 2px 16px rgba(171,71,188,0.4)", "&:hover": { background: "linear-gradient(135deg, #ce93d8, #ab47bc)" } }}>
                        {redeeming ? "Processing..." : `Redeem ${selectedOption?.coinCost} Coins`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Dialog ───────────────────────────────── */}
            <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg, #0a1a0a, #111)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 22 }} />
                        <Typography sx={{ fontWeight: 800, color: "#fff" }}>Redeemed Successfully!</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setSuccessOpen(false)} sx={{ color: "rgba(255,255,255,0.4)" }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {successData && selectedOption && (() => {
                        const info = FULFILLMENT_INFO[selectedOption.category];
                        return (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {/* Code */}
                                <Box sx={{ background: "rgba(255,215,0,0.07)", border: "2px dashed rgba(255,215,0,0.35)", borderRadius: 2, py: 2, px: 3, textAlign: "center" }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 2, mb: 0.5 }}>Your Redemption Code</Typography>
                                    <Typography sx={{ color: "#ffd700", fontWeight: 900, fontSize: "1.8rem", letterSpacing: 3 }}>{successData.redemptionCode}</Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", mt: 0.5 }}>Keep this code safe — you'll need it to claim your benefit</Typography>
                                </Box>

                                {/* What happens next */}
                                {info && (
                                    <Box sx={{ background: "rgba(33,150,243,0.07)", border: "1px solid rgba(33,150,243,0.2)", borderRadius: 2, p: 2 }}>
                                        <Typography sx={{ color: "#42a5f5", fontWeight: 800, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: 1, mb: 1 }}>
                                            {info.icon} What happens next?
                                        </Typography>
                                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", lineHeight: 1.7 }}>
                                            {info.desc}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Balance */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 2, p: 1.5 }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Coins spent:</Typography>
                                    <Typography sx={{ color: "#ab47bc", fontWeight: 800, fontSize: "0.78rem" }}>-{successData.coinsSpent} 🪙</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", background: "rgba(255,215,0,0.05)", borderRadius: 2, p: 1.5, border: "1px solid rgba(255,215,0,0.12)" }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Remaining balance:</Typography>
                                    <Typography sx={{ color: "#ffd700", fontWeight: 800, fontSize: "0.78rem" }}>{successData.remainingCoins} 🪙</Typography>
                                </Box>
                            </Box>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, borderTop: "1px solid rgba(255,255,255,0.05)", pt: 2 }}>
                    <Button onClick={() => { setSuccessOpen(false); setActiveTab(2); }}
                        sx={{ color: "rgba(255,255,255,0.5)", borderRadius: 2, textTransform: "none", border: "1px solid rgba(255,255,255,0.1)" }}>
                        View History
                    </Button>
                    <Button onClick={() => setSuccessOpen(false)} variant="contained"
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 3, background: "linear-gradient(135deg, #2e7d32, #1b5e20)", "&:hover": { background: "linear-gradient(135deg, #388e3c, #2e7d32)" } }}>
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Earn Log Detail Dialog ───────────────────────── */}
            <Dialog open={logDialogOpen} onClose={() => setLogDialogOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg, #111 0%, #1a0505 100%)", border: "1px solid rgba(255,43,43,0.2)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ color: "#ff2b2b", fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2, display: "flex", justifyContent: "space-between" }}>
                    🩸 Donation Details
                    <IconButton size="small" onClick={() => setLogDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.4)" }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedLog && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {[
                                { label: "Type", value: selectedLog.type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) },
                                { label: "Patient Name", value: selectedLog.patientName },
                                { label: "Hospital", value: selectedLog.hospital },
                                { label: "Blood Group", value: selectedLog.bloodGroup },
                                { label: "Description", value: selectedLog.description },
                                { label: "Date", value: new Date(selectedLog.createdAt).toLocaleString("en-IN") },
                            ].filter(i => i.value && i.value !== "—").map(item => (
                                <Box key={item.label} sx={{ background: "rgba(255,255,255,0.04)", borderRadius: 2, p: 2, border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, mb: 0.3 }}>{item.label}</Typography>
                                    <Typography sx={{ color: "#fff", fontWeight: 600 }}>{item.value}</Typography>
                                </Box>
                            ))}
                            <Box sx={{ background: "rgba(255,215,0,0.06)", borderRadius: 2, p: 2, border: "1px solid rgba(255,215,0,0.15)", display: "flex", gap: 3 }}>
                                <Box>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, mb: 0.3 }}>XP Earned</Typography>
                                    <Typography sx={{ color: "#4caf50", fontWeight: 900, fontSize: "1.2rem" }}>+{selectedLog.leaderboardPoints || selectedLog.points || 0}</Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, mb: 0.3 }}>Coins Earned</Typography>
                                    <Typography sx={{ color: "#ffd700", fontWeight: 900, fontSize: "1.2rem" }}>+{selectedLog.coins || 0} 🪙</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

        </Box>
    );
}
