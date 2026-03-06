import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    CircularProgress,
    Drawer,
    IconButton,
    useMediaQuery,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Chip,
    Paper,
    Grid,
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useNavigate } from 'react-router-dom';
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { authUtils } from "../utils/auth";

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const MEDAL_COLORS = {
    1: { bg: "linear-gradient(135deg,#ffd700,#ffb300)", shadow: "0 0 24px rgba(255,215,0,0.4)", emoji: "🥇", border: "#ffd700" },
    2: { bg: "linear-gradient(135deg,#b0bec5,#90a4ae)", shadow: "0 0 18px rgba(176,190,197,0.3)", emoji: "🥈", border: "#b0bec5" },
    3: { bg: "linear-gradient(135deg,#cd7f32,#a0522d)", shadow: "0 0 18px rgba(205,127,50,0.3)", emoji: "🥉", border: "#cd7f32" },
};

function MedalAvatar({ rank, name, photo, size = 56 }) {
    const medal = MEDAL_COLORS[rank];
    return (
        <Box sx={{ position: "relative", display: "inline-flex" }}>
            <Avatar
                src={photo}
                sx={{
                    width: size, height: size,
                    background: medal ? medal.bg : "linear-gradient(135deg,#333,#555)",
                    fontSize: size * 0.4,
                    fontWeight: 900,
                    border: medal ? `2px solid ${medal.border}` : "2px solid #444",
                    boxShadow: medal ? medal.shadow : "none",
                }}
            >
                {!photo && name?.charAt(0).toUpperCase()}
            </Avatar>
            {medal && (
                <Box sx={{
                    position: "absolute", bottom: -6, right: -6,
                    fontSize: size * 0.38, lineHeight: 1,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                }}>
                    {medal.emoji}
                </Box>
            )}
        </Box>
    );
}

export default function Leaderboard() {
    const { t } = useTranslation();
    const [openSidebar, setOpenSidebar] = useState(false);
    const isMobile = useMediaQuery("(max-width:900px)");
    const [user, setUser] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const profileOpen = Boolean(anchorEl);
    const navigate = useNavigate();

    async function loadUser() {
        try {
            const res = await fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers: authUtils.getAuthHeaders() });
            if (res.ok) {
                const u = await res.json();
                setUser(u);
            }
        } catch (e) { console.warn("User fetch failed", e); }
    }

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/rewards/leaderboard`);
            if (res.ok) { const data = await res.json(); setLeaderboard(data); }
        } catch (e) { console.error("Failed to load leaderboard", e); }
        setLoading(false);
    };

    useEffect(() => {
        (async () => { await loadUser(); await loadLeaderboard(); })();
        const onAuth = () => loadUser();
        const onUpdated = () => loadUser();
        try { window.addEventListener('auth-changed', onAuth); window.addEventListener('user-updated', onUpdated); } catch (e) { }
        return () => { try { window.removeEventListener('auth-changed', onAuth); window.removeEventListener('user-updated', onUpdated); } catch (e) { } };
    }, []);

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b0b0b 0%, #151515 100%)", color: "#fff" }}>
            {/* TOP NAV */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: { xs: 2, md: 6 },
                    py: 2,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
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
                        <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)" }}>
                            {!user?.profilePhoto && (user?.name ? user.name.charAt(0).toUpperCase() : "U")}
                        </Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}>
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
                            <Typography variant="caption" sx={{ color: "#777" }}>{user?.email}</Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
                            <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} /> {t('profile')}
                        </MenuItem>
                        <MenuItem onClick={() => { authUtils.logout(); window.location.href = "/"; }}>
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
                    <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 900, mb: 0.5, textShadow: "0 0 20px rgba(255,43,43,0.3)" }}>
                        {t('topHeroes')}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mb: 4 }}>
                        Top donors by leaderboard points
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress color="error" />
                        </Box>
                    ) : leaderboard.length === 0 ? (
                        <Paper sx={{ p: 6, textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography sx={{ color: "#aaa" }}>{t('calculatingRankings')}</Typography>
                        </Paper>
                    ) : (
                        <>
                            {/* ── Top 3 Podium Cards ── */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>

                                {/* #1 Hero — full-width red gradient */}
                                {top3[0] && (() => {
                                    const entry = top3[0];
                                    const isMe = user && entry._id === user._id;
                                    return (
                                        <Box
                                            sx={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                p: { xs: 2.5, md: 3 },
                                                borderRadius: 3,
                                                background: isMe
                                                    ? "linear-gradient(135deg, #cc0000 0%, #ff2b2b 60%, #ff6b6b 100%)"
                                                    : "linear-gradient(135deg, #1a0000 0%, #2d0404 60%, #3a0808 100%)",
                                                border: `1px solid ${isMe ? "rgba(255,100,100,0.6)" : "rgba(255,43,43,0.35)"}`,
                                                boxShadow: isMe ? "0 8px 40px rgba(255,43,43,0.45)" : "0 4px 20px rgba(255,43,43,0.15)",
                                                transition: "transform 0.2s",
                                                "&:hover": { transform: "translateY(-2px)" },
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                                                <MedalAvatar rank={1} name={entry.name} photo={entry.profilePhoto} size={60} />
                                                <Box>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                                                        <Typography sx={{ fontWeight: 900, fontSize: "1.25rem", color: "#fff", letterSpacing: 0.5 }}>
                                                            {entry.name?.toUpperCase()}
                                                        </Typography>
                                                        {isMe && (
                                                            <Chip label={t('you')} size="small" sx={{ height: 20, bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 900, fontSize: "0.65rem" }} />
                                                        )}
                                                    </Box>
                                                    {isMe && (
                                                        <Chip label="Current Real-Hero" size="small" sx={{ mt: 0.5, height: 22, bgcolor: "rgba(0,0,0,0.25)", color: "#fff", fontWeight: 700, fontSize: "0.65rem", borderRadius: 1 }} />
                                                    )}
                                                </Box>
                                            </Box>
                                            <Box sx={{ textAlign: "right" }}>
                                                <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#fff" }}>
                                                    Points: {entry.leaderboardPoints || 0}
                                                </Typography>
                                                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>
                                                    Coins: {entry.coins || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })()}

                                {/* #2 & #3 Side by Side */}
                                {top3.length >= 2 && (
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                        {top3.slice(1).map((entry, i) => {
                                            const rank = i + 2;
                                            const isMe = user && entry._id === user._id;
                                            return (
                                                <Box
                                                    key={entry._id}
                                                    sx={{
                                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                                        p: 2.5, borderRadius: 3,
                                                        background: isMe ? "rgba(255,43,43,0.12)" : "rgba(255,255,255,0.03)",
                                                        border: `1px solid ${isMe ? "rgba(255,43,43,0.4)" : "rgba(255,255,255,0.07)"}`,
                                                        backdropFilter: "blur(8px)",
                                                        transition: "transform 0.2s",
                                                        "&:hover": { transform: "translateY(-2px)", background: isMe ? "rgba(255,43,43,0.18)" : "rgba(255,255,255,0.06)" },
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                        <MedalAvatar rank={rank} name={entry.name} photo={entry.profilePhoto} size={48} />
                                                        <Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                <Typography sx={{ fontWeight: 800, color: isMe ? "#ff4c4c" : "#fff", fontSize: "0.95rem" }}>
                                                                    #{rank} {entry.name}
                                                                </Typography>
                                                                {isMe && <Chip label={t('you')} size="small" sx={{ height: 16, bgcolor: "#ff2b2b", color: "#fff", fontWeight: 900, fontSize: "0.6rem" }} />}
                                                            </Box>
                                                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                                                                Recent Activity: +{entry.recentActivity || 0}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ textAlign: "right" }}>
                                                        <Typography sx={{ color: "#ffd700", fontWeight: 800, fontSize: "0.85rem" }}>
                                                            🏆 {entry.leaderboardPoints || 0}
                                                        </Typography>
                                                        <Typography sx={{ color: "#ffb347", fontWeight: 700, fontSize: "0.8rem" }}>
                                                            🪙 {entry.coins || 0}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>

                            {/* ── Rest of Leaderboard ── */}
                            {rest.length > 0 && (
                                <>
                                    <Typography sx={{ color: "#ff2b2b", fontWeight: 800, fontSize: "1.05rem", mb: 2, letterSpacing: 0.5 }}>
                                        Other Top Donors
                                    </Typography>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                        {rest.map((entry, i) => {
                                            const rank = i + 4;
                                            const isMe = user && entry._id === user._id;
                                            return (
                                                <Box
                                                    key={entry._id}
                                                    sx={{
                                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                                        p: 2, px: 2.5, borderRadius: 2.5,
                                                        background: isMe ? "rgba(255,43,43,0.1)" : "rgba(255,255,255,0.025)",
                                                        border: `1px solid ${isMe ? "rgba(255,43,43,0.3)" : "rgba(255,255,255,0.05)"}`,
                                                        transition: "background 0.2s, transform 0.2s",
                                                        "&:hover": { background: "rgba(255,255,255,0.05)", transform: "translateX(4px)" },
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                        <Box sx={{
                                                            width: 36, height: 36, borderRadius: "50%",
                                                            background: "rgba(255,255,255,0.07)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontWeight: 900, fontSize: 13, color: "rgba(255,255,255,0.5)"
                                                        }}>
                                                            #{rank}
                                                        </Box>
                                                        <Avatar src={entry.profilePhoto} sx={{ width: 36, height: 36, bgcolor: "#333", fontSize: "0.9rem" }}>
                                                            {entry.name?.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                <Typography sx={{ color: isMe ? "#ff4c4c" : "#fff", fontWeight: isMe ? 800 : 500, fontSize: "0.9rem" }}>
                                                                    {entry.name}
                                                                </Typography>
                                                                {isMe && <Chip label={t('you')} size="small" sx={{ height: 16, bgcolor: "#ff2b2b", color: "#fff", fontWeight: 900, fontSize: "0.6rem" }} />}
                                                            </Box>
                                                            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                                                                Donations: {entry.totalDonations || 0}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ textAlign: "right" }}>
                                                        <Typography sx={{ color: "#ffd700", fontWeight: 800, fontSize: "0.82rem" }}>
                                                            🏆 {entry.leaderboardPoints || 0}
                                                        </Typography>
                                                        <Typography sx={{ color: "#ffb347", fontWeight: 700, fontSize: "0.78rem" }}>
                                                            🪙 {entry.coins || 0}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
