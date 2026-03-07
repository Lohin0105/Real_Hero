import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from 'react-i18next';
import {
    Box, Typography, Grid, Avatar, Button, CircularProgress,
    Stack, useMediaQuery, Divider, Menu, MenuItem, IconButton,
    Drawer, Chip, LinearProgress, Tooltip,
} from "@mui/material";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import DownloadIcon from "@mui/icons-material/Download";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PsychologyIcon from "@mui/icons-material/Psychology";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import RefreshIcon from "@mui/icons-material/Refresh";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { authUtils } from "../utils/auth";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, ChartTooltip, Legend);

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// ── Gradient fill plugin for Line chart ─────────────────────────────────────
const gradientLinePlugin = {
    id: 'gradientLine',
    beforeDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        chart.data.datasets.forEach((dataset, i) => {
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(255, 43, 43, 0.55)');
            gradient.addColorStop(0.4, 'rgba(171, 71, 188, 0.25)');
            gradient.addColorStop(1, 'rgba(33, 150, 243, 0.0)');
            dataset.backgroundColor = gradient;
        });
    }
};

// ── Gradient fill plugin for Bar chart ──────────────────────────────────────
const gradientBarPlugin = {
    id: 'gradientBar',
    beforeDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        chart.data.datasets.forEach((dataset) => {
            const colors = dataset.isSurgeMap || [];
            dataset.backgroundColor = dataset.data.map((_, idx) => {
                const isSurge = colors[idx];
                const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                if (isSurge) {
                    grad.addColorStop(0, 'rgba(255,183,0,0.9)');
                    grad.addColorStop(1, 'rgba(255,100,0,0.4)');
                } else {
                    grad.addColorStop(0, 'rgba(255,60,60,0.9)');
                    grad.addColorStop(1, 'rgba(120,0,220,0.35)');
                }
                return grad;
            });
        });
    }
};

const CHART_ANIMATION = { duration: 1200, easing: 'easeInOutQuart' };

const CHART_OPTS_BASE = {
    responsive: true, maintainAspectRatio: false,
    animation: CHART_ANIMATION,
    plugins: { legend: { display: false } },
    scales: {
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555', font: { size: 11 } }, border: { display: false } },
        x: { grid: { display: false }, ticks: { color: '#555', font: { size: 10 }, maxRotation: 35 }, border: { display: false } },
    }
};

// Point colors cycling through the spectrum
const POINT_COLORS = ['#ff2b2b', '#ff6d00', '#ffd600', '#00e676', '#00b0ff', '#d500f9', '#ff4081', '#ff2b2b'];

// ── Glassmorphic card wrapper ──────────────────────────────────────────────────
function GlassCard({ children, sx = {}, accent = "255,255,255" }) {
    return (
        <Box sx={{
            background: `rgba(${accent}, 0.03)`,
            border: `1px solid rgba(${accent}, 0.1)`,
            borderRadius: 3, backdropFilter: "blur(14px)", p: 3,
            height: "100%", display: "flex", flexDirection: "column",
            ...sx
        }}>
            {children}
        </Box>
    );
}

// ── Mini stat card ─────────────────────────────────────────────────────────────
function MiniStat({ icon, label, value, color }) {
    return (
        <Box sx={{
            height: "100%", p: { xs: 2, md: 2.5 }, borderRadius: 3,
            background: `rgba(${color}, 0.05)`, border: `1px solid rgba(${color}, 0.15)`,
            transition: "0.25s", "&:hover": { transform: "translateY(-3px)", boxShadow: `0 10px 30px rgba(${color}, 0.15)` },
        }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ color: `rgb(${color})`, display: "flex", fontSize: "1rem" }}>{icon}</Box>
                <Typography sx={{ color: `rgb(${color})`, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</Typography>
            </Box>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: { xs: "1.4rem", md: "1.7rem" }, lineHeight: 1 }}>{value}</Typography>
        </Box>
    );
}

// ── Score gauge ring ───────────────────────────────────────────────────────────
function ScoreGauge({ score, category }) {
    const color = score >= 70 ? "#4caf50" : score >= 40 ? "#ff9800" : "#ff5252";
    const pct = score / 100;
    const r = 54, circ = 2 * Math.PI * r;
    return (
        <Box sx={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontWeight: 900, fontSize: "1.8rem", color, lineHeight: 1 }}>{score}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>/ 100</Typography>
            </Box>
        </Box>
    );
}

export default function Analytics() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [readiness, setReadiness] = useState(null);
    const [shortageRisk, setShortageRisk] = useState(null);
    const [demandSim, setDemandSim] = useState(null);
    const [simLoading, setSimLoading] = useState(false);
    const [simLastUpdated, setSimLastUpdated] = useState(null);
    const [platformStats, setPlatformStats] = useState(null);
    const [loyaltyTier, setLoyaltyTier] = useState(null);
    const [bestTime, setBestTime] = useState(null);
    const [trajectory, setTrajectory] = useState(null);
    const [aiInsight, setAiInsight] = useState(null);
    const [aiHealth, setAiHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedBloodGroup, setSelectedBloodGroup] = useState("O+");
    const isMobile = useMediaQuery("(max-width:900px)");
    const [openSidebar, setOpenSidebar] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const simIntervalRef = useRef(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const headers = authUtils.getAuthHeaders();
            const [userRes] = await Promise.all([
                fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers })
            ]);
            if (!userRes.ok) { setLoading(false); return; }
            const u = await userRes.json();
            setUser(u);

            const [statsRes, readinessRes, shortageRes, simRes, platRes, loyaltyRes, bestTimeRes, trajRes, insightRes, healthRes] = await Promise.all([
                fetch(`${API_BASE}/api/analytics/user/${u._id}`, { headers }),
                fetch(`${API_BASE}/api/analytics/ml/donor-readiness`, { headers }),
                fetch(`${API_BASE}/api/analytics/ml/shortage-risk`, { headers }),
                fetch(`${API_BASE}/api/analytics/ml/demand-simulation?bloodGroup=${encodeURIComponent(u.bloodGroup || 'O+')}`, { headers }),
                fetch(`${API_BASE}/api/analytics/platform-stats`, { headers }),
                fetch(`${API_BASE}/api/analytics/ml/loyalty-tier`, { headers }),
                fetch(`${API_BASE}/api/analytics/ml/best-time`, { headers }),
                fetch(`${API_BASE}/api/analytics/ml/impact-trajectory`, { headers }),
                fetch(`${API_BASE}/api/analytics/ml/generative-insight`, { headers }),
                fetch(`${API_BASE}/api/analytics/ml/health-advisor`, { headers }),
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (readinessRes.ok) setReadiness(await readinessRes.json());
            if (shortageRes.ok) setShortageRisk(await shortageRes.json());
            if (simRes.ok) setDemandSim(await simRes.json());
            if (platRes.ok) setPlatformStats(await platRes.json());
            if (loyaltyRes.ok) setLoyaltyTier(await loyaltyRes.json());
            if (bestTimeRes.ok) setBestTime(await bestTimeRes.json());
            if (trajRes.ok) setTrajectory(await trajRes.json());
            if (insightRes.ok) setAiInsight(await insightRes.json());
            if (healthRes.ok) setAiHealth(await healthRes.json());
        } catch (e) { console.error("Analytics load error:", e); }
        setLoading(false);
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    // ── Live polling for demand simulation (every 60 s) ──────────────────────
    const refetchSim = useCallback(async (bg, showSpinner = false) => {
        if (showSpinner) setSimLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/analytics/ml/demand-simulation?bloodGroup=${encodeURIComponent(bg)}`, { headers: authUtils.getAuthHeaders() });
            if (res.ok) {
                setDemandSim(await res.json());
                setSimLastUpdated(new Date());
            }
        } catch (e) { }
        if (showSpinner) setSimLoading(false);
    }, []);

    useEffect(() => {
        // Start live polling once user is loaded
        if (!user) return;
        // Poll every 60 seconds
        simIntervalRef.current = setInterval(() => refetchSim(selectedBloodGroup), 60000);
        return () => clearInterval(simIntervalRef.current);
    }, [user, selectedBloodGroup, refetchSim]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#080808', flexDirection: "column", gap: 2 }}>
            <PsychologyIcon sx={{ fontSize: 48, color: "#ff2b2b", opacity: 0.7 }} />
            <CircularProgress sx={{ color: "#ff2b2b" }} size={28} />
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>Loading ML models…</Typography>
        </Box>
    );

    // ── Chart data ─────────────────────────────────────────────────────────────
    const trendData = stats?.monthlyTrend?.map(d => d.count) || [];
    const lineData = {
        labels: stats?.monthlyTrend?.map(d => d.month) || [],
        datasets: [{
            label: 'Donations',
            data: trendData,
            borderColor: 'rgba(255,60,60,1)',
            borderWidth: 3,
            tension: 0.48,
            fill: true,
            pointBackgroundColor: trendData.map((_, i) => POINT_COLORS[i % POINT_COLORS.length]),
            pointBorderColor: '#111',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 9,
            pointHoverBorderWidth: 3,
            pointHoverBorderColor: '#fff',
        }]
    };

    const surgeMap = demandSim?.days?.map(d => d.isSurge) || [];
    const simData = {
        labels: demandSim?.days?.map(d => d.day) || ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
        datasets: [{
            label: 'Predicted Requests',
            data: demandSim?.days?.map(d => d.predicted) || [],
            isSurgeMap: surgeMap,         // picked up by gradientBarPlugin
            borderColor: surgeMap.map(s => s ? '#ffb300' : '#ff2b2b'),
            borderWidth: 1.5, borderRadius: 8,
        }]
    };

    const doughnutData = {
        labels: stats?.bloodDistribution?.map(d => d.group) || [],
        datasets: [{
            data: stats?.bloodDistribution?.map(d => d.count) || [],
            backgroundColor: ['#ff1744', '#d500f9', '#2979ff', '#00e676', '#ffd600', '#ff6d00', '#00e5ff', '#8d6e63'],
            hoverBackgroundColor: ['#ff4569', '#ea40fb', '#5393ff', '#33eb91', '#ffe033', '#ff9133', '#29ffff', '#a1887f'],
            borderWidth: 2, borderColor: '#0f0f0f',
        }]
    };

    const trendIcon = (demandSim?.trend === 'rising' || demandSim?.trend === 'increasing') ? '📈' : (demandSim?.trend === 'falling' || demandSim?.trend === 'decreasing') ? '📉' : '➡️';
    const trendColor = (demandSim?.trend === 'rising' || demandSim?.trend === 'increasing') ? '#ff9800' : (demandSim?.trend === 'falling' || demandSim?.trend === 'decreasing') ? '#4caf50' : '#42a5f5';

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg, #080808 0%, #0f0f0f 50%, #050510 100%)", color: "#fff", fontFamily: "'Poppins', sans-serif" }}>

            {/* TOP NAV */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2, md: 6 }, py: 2, borderBottom: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, background: "rgba(8,8,8,0.85)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpenSidebar(true)}><MenuIcon /></IconButton>
                    <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 800, textShadow: "0 0 18px rgba(255,20,20,0.85)" }}>Real-Hero</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Chip icon={<PsychologyIcon sx={{ fontSize: "14px !important", color: "#42a5f5 !important" }} />} label="ML Analytics" size="small"
                        sx={{ bgcolor: "rgba(33,150,243,0.1)", color: "#42a5f5", fontWeight: 700, border: "1px solid rgba(33,150,243,0.25)", borderRadius: 2, fontSize: "0.7rem" }} />
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)", width: 36, height: 36, fontSize: "0.85rem", fontWeight: 700 }}>
                            {!user?.profilePhoto && user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "#fff" } }}>
                        <Box sx={{ px: 2, py: 1.5 }}><Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography><Typography variant="caption" sx={{ color: "#777" }}>{user?.email}</Typography></Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }} sx={{ color: "rgba(255,255,255,0.8)", gap: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}><AccountCircleIcon fontSize="small" /> Profile</MenuItem>
                        <MenuItem onClick={() => { authUtils.logout(); window.location.href = "/"; }} sx={{ color: "rgba(255,255,255,0.8)", gap: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}><LogoutIcon fontSize="small" /> Logout</MenuItem>
                    </Menu>
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 3, px: { xs: 0, md: 3 }, py: { xs: 2, md: 3 } }}>
                {!isMobile && <Box sx={{ width: 260, flexShrink: 0 }}><Sidebar /></Box>}
                {isMobile && <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)} sx={{ "& .MuiDrawer-paper": { width: 260, background: "#0b0b0b" } }}><Sidebar /></Drawer>}

                <Box sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 0 }, pr: { md: 3 } }}>

                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#ff2b2b", textShadow: "0 0 20px rgba(255,43,43,0.3)" }}>Donation Analytics</Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", mt: 0.3 }}>ML-powered insights · Updated live</Typography>
                        </Box>
                        <Button variant="contained" startIcon={<DownloadIcon />}
                            onClick={() => { const text = `I've saved ${stats?.summary?.livesSaved || 0} lives through blood donation. Join me on Real-Hero!`; navigator.share ? navigator.share({ title: 'Real-Hero Donor', text, url: window.location.origin }) : alert(text); }}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg, #ff2b2b, #c62828)", boxShadow: "0 4px 15px rgba(255,43,43,0.35)", "&:hover": { boxShadow: "0 6px 20px rgba(255,43,43,0.5)" } }}>
                            Share Journey
                        </Button>
                    </Box>

                    {/* ── STATS GRID (RESPONSIVE) ─────────────────────────────── */}
                    <Grid container spacing={1.5} sx={{ mb: 3 }}>
                        {[
                            { icon: <VolunteerActivismIcon fontSize="small" />, label: "Donations", value: stats?.summary?.totalDonations ?? 0, color: "255,43,43" },
                            { icon: <FavoriteIcon fontSize="small" />, label: "Lives Saved", value: stats?.summary?.livesSaved ?? 0, color: "76,175,80" },
                            { icon: <WorkspacePremiumIcon fontSize="small" />, label: "XP Points", value: stats?.summary?.points ?? 0, color: "33,150,243" },
                            { icon: <MonetizationOnIcon fontSize="small" />, label: "Coins", value: stats?.summary?.coins ?? 0, color: "255,215,0" },
                            { icon: <PeopleIcon fontSize="small" />, label: "Total Donors", value: platformStats?.totalUsers ?? "—", color: "171,71,188" },
                            { icon: <FavoriteIcon fontSize="small" />, label: "Fulfilled", value: platformStats?.fulfilledRequests ?? "—", color: "255,87,34" },
                            { icon: <CheckCircleIcon fontSize="small" />, label: "Fulfillment", value: platformStats != null ? `${platformStats.fulfillmentRate}%` : "—", color: "0,188,212" },
                            { icon: <WarningIcon fontSize="small" />, label: "Most Needed", value: platformStats?.mostNeededBloodGroup ?? "—", color: "255,152,0" },
                        ].map((s, i) => (
                            <Grid item xs={6} sm={3} lg={3} key={i}>
                                <MiniStat {...s} />
                            </Grid>
                        ))}
                    </Grid>

                    {/* ── ML SECTION HEADER ─────────────────────────────────── */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <PsychologyIcon sx={{ color: "#42a5f5" }} />
                        <Typography sx={{ fontWeight: 800, color: "#42a5f5", letterSpacing: 0.5 }}>ML-Powered Insights</Typography>
                        <Chip label="8 Models Active" size="small" sx={{ bgcolor: "rgba(33,150,243,0.1)", color: "#42a5f5", fontWeight: 700, border: "1px solid rgba(33,150,243,0.25)", borderRadius: 1, fontSize: "0.65rem" }} />
                    </Box>

                    <Grid container spacing={2.5} sx={{ mb: 3 }}>

                        {/* ── AI MODEL 7: GENERATIVE INSIGHT BRIEFING ────────── */}
                        <Grid item xs={12}>
                            <GlassCard accent="171,71,188">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "#ab47bc" }}>✨ AI Model 7 · Generative Morning Briefing</Typography>
                                        {aiInsight?.tags?.map(t => (
                                            <Chip key={t} label={t} size="small" sx={{ bgcolor: "rgba(171,71,188,0.15)", color: "#ce93d8", fontWeight: 800, border: "1px solid rgba(171,71,188,0.3)", borderRadius: 1, fontSize: "0.6rem", height: 20 }} />
                                        ))}
                                    </Box>
                                </Box>
                                {aiInsight ? (
                                    <Box sx={{ p: 2.5, borderRadius: 3, background: "linear-gradient(135deg, rgba(171,71,188,0.1), rgba(171,71,188,0.02))", border: "1px solid rgba(171,71,188,0.2)", position: "relative", overflow: "hidden" }}>
                                        {/* Decorative pulse */}
                                        <Box sx={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: "radial-gradient(circle, rgba(171,71,188,0.2) 0%, transparent 70%)", borderRadius: "50%", animation: "pulse 3s infinite" }} />
                                        <Typography sx={{ color: "#fff", fontSize: "1.1rem", lineHeight: 1.6, fontWeight: 500, letterSpacing: 0.3, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                                            "{aiInsight.briefing}"
                                        </Typography>
                                    </Box>
                                ) : <Box sx={{ p: 2, opacity: 0.4 }}><Typography>Synthesizing briefing...</Typography></Box>}
                            </GlassCard>
                        </Grid>

                        {/* ── AI MODEL 8: HEALTH ADVISOR ──────────────────────── */}
                        <Grid item xs={12}>
                            <GlassCard accent="76,175,80">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "#4caf50" }}>🩺 AI Model 8 · Health & Recovery Advisor</Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>{aiHealth?.modelNote}</Typography>
                                </Box>
                                {aiHealth ? (
                                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
                                        {/* Left Side: Biometric Progress */}
                                        <Box sx={{ flex: 1, p: 2, borderRadius: 2, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1, mb: 1 }}>Biometric Recovery Phase</Typography>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 1 }}>
                                                <Typography sx={{ color: "#4caf50", fontWeight: 800, fontSize: "1.2rem" }}>{aiHealth.phase}</Typography>
                                                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1 }}>{aiHealth.progress}%</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={aiHealth.progress}
                                                sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.05)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #4caf50, #8bc34a)", borderRadius: 4 } }} />
                                            {aiHealth.daysSince !== null && (
                                                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mt: 1.5, textAlign: "right" }}>Day {aiHealth.daysSince} post-donation</Typography>
                                            )}
                                        </Box>

                                        {/* Right Side: Protocol Recommendations */}
                                        <Box sx={{ flex: 1.5, display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                                            <Box sx={{ flex: 1, p: 2, borderRadius: 2, background: "rgba(76,175,80,0.05)", border: "1px solid rgba(76,175,80,0.2)" }}>
                                                <Typography sx={{ color: "#4caf50", fontSize: "0.75rem", fontWeight: 800, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}><RestaurantIcon fontSize="small" /> Diet Protocol</Typography>
                                                <Stack spacing={1}>
                                                    {aiHealth.diet.map((d, i) => (
                                                        <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                                                            <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: "rgba(76,175,80,0.2)", color: "#8bc34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", flexShrink: 0, mt: 0.3 }}>✓</Box>
                                                            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>{d}</Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                            <Box sx={{ flex: 1, p: 2, borderRadius: 2, background: "rgba(33,150,243,0.05)", border: "1px solid rgba(33,150,243,0.2)" }}>
                                                <Typography sx={{ color: "#42a5f5", fontSize: "0.75rem", fontWeight: 800, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}><DirectionsRunIcon fontSize="small" /> Lifestyle & Activity</Typography>
                                                <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem", lineHeight: 1.5 }}>{aiHealth.activity}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ) : <Box sx={{ p: 2, opacity: 0.4 }}><Typography>Loading recovery profile...</Typography></Box>}
                            </GlassCard>
                        </Grid>

                        {/* ── ML MODEL 1: DONOR READINESS ──────────────────── */}
                        <Grid item xs={12} md={6}>
                            <GlassCard accent="33,150,243">
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "#42a5f5" }}>🧠 Model 1 · Donor Readiness Score</Typography>
                                </Box>

                                {readiness ? (
                                    <>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
                                            <ScoreGauge score={readiness.score} />
                                            <Box sx={{ flex: 1 }}>
                                                <Chip label={readiness.category} size="small"
                                                    sx={{ bgcolor: readiness.score >= 70 ? "rgba(76,175,80,0.15)" : readiness.score >= 40 ? "rgba(255,152,0,0.15)" : "rgba(255,82,82,0.15)", color: readiness.score >= 70 ? "#4caf50" : readiness.score >= 40 ? "#ff9800" : "#ff5252", fontWeight: 800, border: `1px solid ${readiness.score >= 70 ? "rgba(76,175,80,0.3)" : readiness.score >= 40 ? "rgba(255,152,0,0.3)" : "rgba(255,82,82,0.3)"}`, borderRadius: 1, mb: 1.5 }} />
                                                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", mb: 0.5 }}>Next eligible date:</Typography>
                                                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>{readiness.nextEligibleDate}</Typography>
                                                {readiness.daysSince !== null && (
                                                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", mt: 0.5 }}>{readiness.daysSince} days since last donation</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        <Stack spacing={1}>
                                            {readiness.factors?.map((f, i) => (
                                                <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", borderRadius: 1.5, px: 1.5, py: 0.8 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: f.positive ? "#4caf50" : "#ff5252" }} />
                                                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>{f.label}</Typography>
                                                    </Box>
                                                    <Typography sx={{ color: f.positive ? "#4caf50" : "#ff5252", fontWeight: 800, fontSize: "0.75rem" }}>{f.impact}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </>
                                ) : (
                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
                                        <Typography sx={{ fontSize: "0.85rem" }}>Could not load readiness data</Typography>
                                    </Box>
                                )}
                            </GlassCard>
                        </Grid>

                        {/* ── ML MODEL 2: SHORTAGE RISK ────────────────────── */}
                        <Grid item xs={12} md={6}>
                            <GlassCard accent="255,43,43">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "#ff5252" }}>🩸 Model 2 · Blood Shortage Risk</Typography>
                                    {shortageRisk?.criticalCount > 0 && (
                                        <Chip label={`${shortageRisk.criticalCount} Critical`} size="small" sx={{ bgcolor: "rgba(255,23,68,0.15)", color: "#ff1744", fontWeight: 800, border: "1px solid rgba(255,23,68,0.3)", borderRadius: 1, fontSize: "0.65rem" }} />
                                    )}
                                </Box>
                                {shortageRisk ? (
                                    <Stack spacing={1.2} sx={{ flex: 1 }}>
                                        {shortageRisk.bloodGroups?.slice(0, 6).map(g => (
                                            <Box key={g.group}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", minWidth: 32 }}>{g.group}</Typography>
                                                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>{g.requests} req · {g.donors} donors</Typography>
                                                    </Box>
                                                    <Chip label={g.riskLevel} size="small" sx={{ bgcolor: `${g.riskColor}18`, color: g.riskColor, fontWeight: 800, border: `1px solid ${g.riskColor}44`, borderRadius: 1, height: 18, fontSize: "0.6rem" }} />
                                                </Box>
                                                <LinearProgress variant="determinate" value={g.riskScore}
                                                    sx={{ height: 5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", "& .MuiLinearProgress-bar": { bgcolor: g.riskColor, borderRadius: 3 } }} />
                                            </Box>
                                        ))}
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, pt: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>Active requests: <strong style={{ color: "#fff" }}>{shortageRisk.totalActiveRequests}</strong></Typography>
                                            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>Available donors: <strong style={{ color: "#4caf50" }}>{shortageRisk.totalAvailableDonors}</strong></Typography>
                                        </Box>
                                    </Stack>
                                ) : (
                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}><Typography sx={{ fontSize: "0.85rem" }}>Could not load risk data</Typography></Box>
                                )}
                            </GlassCard>
                        </Grid>

                        {/* ── ML MODEL 4: LOYALTY TIER ──────────────────────── */}
                        <Grid item xs={12} md={5}>
                            <GlassCard accent="255,215,0">
                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "#ffd700", mb: 2 }}>🏅 Model 4 · Donor Loyalty Tier (RFR)</Typography>
                                {loyaltyTier ? (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        {/* Tier badge */}
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 2, background: `${loyaltyTier.tierColor}12`, border: `1px solid ${loyaltyTier.tierColor}33`, boxShadow: `0 0 20px ${loyaltyTier.tierColor}22` }}>
                                            <Typography sx={{ fontSize: "2.5rem", lineHeight: 1 }}>{loyaltyTier.tierIcon}</Typography>
                                            <Box>
                                                <Typography sx={{ fontWeight: 900, fontSize: "1.1rem", color: loyaltyTier.tierColor }}>{loyaltyTier.tier}</Typography>
                                                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Top {100 - loyaltyTier.percentile}% of donors · Score {loyaltyTier.totalScore}/100</Typography>
                                            </Box>
                                        </Box>
                                        {/* RFR breakdown */}
                                        <Box>
                                            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", mb: 1, textTransform: "uppercase", letterSpacing: 1 }}>RFR Score Breakdown</Typography>
                                            {[
                                                { label: 'R — Recency', val: loyaltyTier.breakdown?.recency, max: 40, color: '#42a5f5' },
                                                { label: 'F — Frequency', val: loyaltyTier.breakdown?.frequency, max: 40, color: '#ab47bc' },
                                                { label: 'R — Reliability', val: loyaltyTier.breakdown?.reliability, max: 20, color: '#4caf50' },
                                            ].map(item => (
                                                <Box key={item.label} sx={{ mb: 1.2 }}>
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                                                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>{item.label}</Typography>
                                                        <Typography sx={{ color: item.color, fontWeight: 700, fontSize: "0.72rem" }}>{item.val}/{item.max}</Typography>
                                                    </Box>
                                                    <LinearProgress variant="determinate" value={(item.val / item.max) * 100}
                                                        sx={{ height: 5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", "& .MuiLinearProgress-bar": { bgcolor: item.color, borderRadius: 3 } }} />
                                                </Box>
                                            ))}
                                        </Box>
                                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", borderTop: "1px solid rgba(255,255,255,0.06)", pt: 1 }}>{loyaltyTier.nextTierMsg}</Typography>
                                    </Box>
                                ) : <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}><Typography sx={{ fontSize: "0.85rem" }}>Loading…</Typography></Box>}
                            </GlassCard>
                        </Grid>

                        {/* ── ML MODEL 5: BEST TIME TO DONATE ──────────────── */}
                        <Grid item xs={12} md={7}>
                            <GlassCard accent="0,229,118">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "#00e676" }}>⏰ Model 5 · Best Time to Donate</Typography>
                                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", mt: 0.3 }}>{bestTime?.modelNote || "Historical request pattern analysis"}</Typography>
                                    </Box>
                                    {bestTime?.peakDay && (
                                        <Chip label={`Peak: ${bestTime.peakDay}`} size="small" sx={{ bgcolor: "rgba(0,230,118,0.1)", color: "#00e676", fontWeight: 800, border: "1px solid rgba(0,230,118,0.3)", borderRadius: 1, fontSize: "0.7rem" }} />
                                    )}
                                </Box>
                                {bestTime ? (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        {/* Day-of-week mini bar chart */}
                                        <Box>
                                            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", mb: 1, textTransform: "uppercase", letterSpacing: 1 }}>Requests by Day of Week (from DB)</Typography>
                                            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.8, height: 60 }}>
                                                {bestTime.dayData?.map((d, i) => {
                                                    const maxCount = Math.max(...(bestTime.dayData?.map(x => x.count) || [1]), 1);
                                                    const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 10;
                                                    const isPeak = d.day === bestTime.peakDay;
                                                    return (
                                                        <Tooltip key={d.day} title={`${d.day}: ${d.count} requests`}>
                                                            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                                                                <Box sx={{ width: "100%", height: `${Math.max(pct, 8)}%`, maxHeight: 48, borderRadius: "3px 3px 0 0", background: isPeak ? "linear-gradient(180deg, #00e676, #00a152)" : "rgba(255,255,255,0.1)", boxShadow: isPeak ? "0 0 8px rgba(0,230,118,0.4)" : "none", transition: "0.3s", minHeight: 4 }} />
                                                                <Typography sx={{ color: isPeak ? "#00e676" : "rgba(255,255,255,0.3)", fontSize: "0.6rem", fontWeight: isPeak ? 800 : 400 }}>{d.short}</Typography>
                                                            </Box>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                        {/* Time slot cards */}
                                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                            {bestTime.timeSlots?.map(slot => {
                                                const isBest = slot.slot === bestTime.bestSlot?.slot;
                                                return (
                                                    <Box key={slot.slot} sx={{ flex: "1 1 90px", p: 1.5, borderRadius: 2, background: isBest ? "rgba(0,230,118,0.1)" : "rgba(255,255,255,0.02)", border: isBest ? "1px solid rgba(0,230,118,0.35)" : "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                                                        <Typography sx={{ color: isBest ? "#00e676" : "rgba(255,255,255,0.4)", fontWeight: 800, fontSize: "0.7rem" }}>{slot.slot}</Typography>
                                                        <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.62rem" }}>{slot.time}</Typography>
                                                        <Typography sx={{ color: isBest ? "#00e676" : "#666", fontWeight: 900, fontSize: "0.9rem", mt: 0.3 }}>{slot.score}</Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                        <Box sx={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.15)", borderRadius: 2, p: 1.5 }}>
                                            <Typography sx={{ color: "#00e676", fontSize: "0.78rem", fontWeight: 700 }}>💡 {bestTime.recommendation}</Typography>
                                        </Box>
                                    </Box>
                                ) : <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}><Typography sx={{ fontSize: "0.85rem" }}>Loading…</Typography></Box>}
                            </GlassCard>
                        </Grid>

                        {/* ── ML MODEL 6: IMPACT TRAJECTORY ────────────────── */}
                        <Grid item xs={12}>
                            <GlassCard accent="33,150,243">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 2 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "#42a5f5" }}>🚀 Model 6 · 12-Month Impact Trajectory</Typography>
                                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", mt: 0.3 }}>{trajectory?.modelNote || "Linear Regression on 6-month donation history"}</Typography>
                                    </Box>
                                    {/* Projected stats */}
                                    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                        {[
                                            { label: "Projected Donations", value: trajectory?.projectedDonations ?? "—", color: "#42a5f5" },
                                            { label: "Total Lives Saved (proj.)", value: trajectory?.projectedLivesSaved ?? "—", color: "#4caf50" },
                                            { label: "Coins to Earn", value: trajectory?.projectedCoins ?? "—", color: "#ffd700" },
                                        ].map(s => (
                                            <Box key={s.label} sx={{ textAlign: "center" }}>
                                                <Typography sx={{ color: s.color, fontWeight: 900, fontSize: "1.4rem", lineHeight: 1 }}>{s.value}</Typography>
                                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                <Box sx={{ height: 180 }}>
                                    <Line
                                        data={{
                                            labels: trajectory?.months?.map(m => m.month) || [],
                                            datasets: [
                                                { label: 'Monthly Predicted', data: trajectory?.months?.map(m => m.predicted) || [], borderColor: '#42a5f5', backgroundColor: 'rgba(33,150,243,0.0)', tension: 0.45, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#42a5f5', pointBorderColor: '#111', borderDash: [], fill: false },
                                                { label: 'Cumulative Donations', data: trajectory?.months?.map(m => m.cumulative) || [], borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.08)', tension: 0.45, borderWidth: 2, pointRadius: 3, fill: true, borderDash: [5, 3] },
                                            ]
                                        }}
                                        options={{ ...CHART_OPTS_BASE, animation: CHART_ANIMATION, plugins: { legend: { display: true, labels: { color: '#888', usePointStyle: true, font: { size: 11 } } }, tooltip: { backgroundColor: 'rgba(20,20,20,0.9)', titleColor: '#fff', bodyColor: '#aaa', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 } } }}
                                    />
                                </Box>
                                {trajectory?.trend && (
                                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", mt: 1 }}>
                                        Trend: <strong style={{ color: trajectory.trend === 'increasing' ? '#4caf50' : trajectory.trend === 'decreasing' ? '#ff5252' : '#42a5f5' }}>{trajectory.trend}</strong>
                                        {trajectory.slope !== 0 && ` (slope: ${trajectory.slope > 0 ? '+' : ''}${trajectory.slope} donations/month)`}
                                    </Typography>
                                )}
                            </GlassCard>
                        </Grid>

                        {/* ── ML MODEL 3: 7-DAY DEMAND SIMULATION ─────────── */}
                        <Grid item xs={12} md={8}>
                            <GlassCard accent="255,152,0">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
                                    <Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "#ff9800" }}>📈 Model 3 · 7-Day Demand Simulation</Typography>
                                            {/* LIVE badge */}
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "rgba(255,152,0,0.12)", border: "1px solid rgba(255,152,0,0.3)", borderRadius: 1, px: 1, py: 0.2 }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#ff9800", boxShadow: "0 0 6px #ff9800", animation: "livePulse 1.5s infinite", "@keyframes livePulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
                                                <Typography sx={{ color: "#ff9800", fontWeight: 800, fontSize: "0.6rem", letterSpacing: 1 }}>LIVE</Typography>
                                            </Box>
                                        </Box>
                                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", mt: 0.3 }}>
                                            {demandSim?.modelUsed || "Holt-Winters + DB History"}
                                            {simLastUpdated && (
                                                <span style={{ marginLeft: 8 }}>· Updated {simLastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            )}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                        <Chip label={`Trend: ${trendIcon} ${demandSim?.trend || "stable"}`} size="small"
                                            sx={{ bgcolor: "rgba(255,255,255,0.05)", color: trendColor, fontWeight: 700, borderRadius: 1, fontSize: "0.7rem", border: `1px solid ${trendColor}44` }} />
                                        {/* Manual refresh */}
                                        <Tooltip title="Refresh now">
                                            <IconButton size="small" onClick={() => refetchSim(selectedBloodGroup, true)}
                                                sx={{ bgcolor: "rgba(255,152,0,0.08)", color: simLoading ? "#ff9800" : "rgba(255,255,255,0.35)", width: 26, height: 26, "&:hover": { color: "#ff9800" } }}>
                                                {simLoading ? <CircularProgress size={12} sx={{ color: "#ff9800" }} /> : <RefreshIcon sx={{ fontSize: 14 }} />}
                                            </IconButton>
                                        </Tooltip>
                                        {/* All 8 blood groups */}
                                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                                <Chip key={bg} label={bg} size="small"
                                                    onClick={() => { setSelectedBloodGroup(bg); refetchSim(bg, true); }}
                                                    sx={{ bgcolor: selectedBloodGroup === bg ? "rgba(255,152,0,0.2)" : "rgba(255,255,255,0.04)", color: selectedBloodGroup === bg ? "#ff9800" : "rgba(255,255,255,0.4)", fontWeight: 700, borderRadius: 1, fontSize: "0.65rem", cursor: "pointer", border: selectedBloodGroup === bg ? "1px solid rgba(255,152,0,0.4)" : "1px solid transparent", "&:hover": { bgcolor: "rgba(255,152,0,0.12)", color: "#ff9800" } }} />
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1, minHeight: 200 }}>
                                    <Bar data={simData}
                                        plugins={[gradientBarPlugin]}
                                        options={{
                                            ...CHART_OPTS_BASE,
                                            animation: CHART_ANIMATION,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: { callbacks: { label: (ctx) => ` Predicted: ${ctx.raw} requests` }, backgroundColor: 'rgba(20,20,20,0.9)', titleColor: '#fff', bodyColor: '#aaa', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }
                                            }
                                        }}
                                    />
                                </Box>
                                <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}><Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: "rgba(255,43,43,0.5)" }} /><Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>Normal day</Typography></Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}><Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: "rgba(255,152,0,0.6)" }} /><Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>Surge day (weekend / month-end)</Typography></Box>
                                </Box>
                            </GlassCard>
                        </Grid>

                        {/* ── DONATION TREND ───────────────────────────────── */}
                        <Grid item xs={12} md={4}>
                            <GlassCard>
                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.5)", mb: 2 }}>📊 Monthly Donation Trend</Typography>
                                <Box sx={{ flex: 1, minHeight: 200 }}>
                                    <Line data={lineData}
                                        plugins={[gradientLinePlugin]}
                                        options={{
                                            ...CHART_OPTS_BASE,
                                            animation: CHART_ANIMATION,
                                            elements: { line: { borderJoinStyle: 'round', cubicInterpolationMode: 'monotone' } },
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: { backgroundColor: 'rgba(20,20,20,0.9)', titleColor: '#fff', bodyColor: '#aaa', borderColor: 'rgba(255,43,43,0.3)', borderWidth: 1, callbacks: { label: (ctx) => ` Donations: ${ctx.raw}` } }
                                            }
                                        }}
                                    />
                                </Box>
                            </GlassCard>
                        </Grid>

                        {/* ── BLOOD GROUP PIE ──────────────────────────────── */}
                        <Grid item xs={12} md={5}>
                            <GlassCard>
                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.5)", mb: 2 }}>🍩 Your Blood Group Contributions</Typography>
                                {stats?.bloodDistribution?.length > 0 ? (
                                    <Box sx={{ flex: 1, minHeight: 220, display: "flex", justifyContent: "center" }}>
                                        <Doughnut data={doughnutData} options={{
                                            responsive: true, maintainAspectRatio: false,
                                            animation: CHART_ANIMATION,
                                            cutout: '68%',
                                            plugins: {
                                                legend: { position: 'right', labels: { color: '#888', usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 11 } } },
                                                tooltip: { backgroundColor: 'rgba(20,20,20,0.9)', titleColor: '#fff', bodyColor: '#aaa', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }
                                            }
                                        }} />
                                    </Box>
                                ) : (
                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
                                        <Typography sx={{ fontSize: "0.85rem" }}>No donation history yet</Typography>
                                    </Box>
                                )}
                            </GlassCard>
                        </Grid>

                        {/* ── CERTIFICATES ─────────────────────────────────── */}
                        <Grid item xs={12} md={7}>
                            <GlassCard>
                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.5)", mb: 2 }}>🏅 Donation Certificates</Typography>
                                {stats?.recentDonations?.length > 0 ? (
                                    <Stack spacing={1.5} sx={{ flex: 1, overflowY: "auto", pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: 10 } }}>
                                        {stats.recentDonations.map((don, i) => (
                                            <Box key={don.id || i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, background: "rgba(255,255,255,0.02)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.05)", transition: "0.2s", "&:hover": { borderColor: "rgba(255,43,43,0.2)", background: "rgba(255,43,43,0.04)" } }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                    <Box sx={{ width: 38, height: 38, borderRadius: "50%", bgcolor: "rgba(255,43,43,0.1)", border: "1px solid rgba(255,43,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#ff2b2b", fontSize: "0.8rem" }}>{don.bloodGroup}</Box>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{don.hospital}</Typography>
                                                        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>{new Date(don.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Typography>
                                                    </Box>
                                                </Box>
                                                <Tooltip title="Download Certificate">
                                                    <IconButton size="small" onClick={() => window.open(`${API_BASE}/api/analytics/certificate/${don.id}`, '_blank')}
                                                        sx={{ bgcolor: "rgba(255,43,43,0.08)", color: "#ff5252", "&:hover": { bgcolor: "#ff2b2b", color: "#fff" } }}>
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1, opacity: 0.4 }}>
                                        <VolunteerActivismIcon sx={{ fontSize: 40 }} />
                                        <Typography sx={{ fontSize: "0.85rem" }}>Complete a donation to get your certificate</Typography>
                                    </Box>
                                )}
                            </GlassCard>
                        </Grid>

                    </Grid>
                </Box>
            </Box>
        </Box>
    );
}
