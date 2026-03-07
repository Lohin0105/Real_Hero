import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Stack,
  useMediaQuery,
  Drawer,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import RefreshIcon from "@mui/icons-material/Refresh";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShareIcon from "@mui/icons-material/Share";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { requestNotificationPermission, subscribeUserToPush } from "../utils/pushNotifications";
import MapComponent from "../components/MapComponent";
import { authUtils } from "../utils/auth";


// Compute API base for LAN use (replace localhost with the current host when appropriate)
let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
try {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(API_BASE)) {
      API_BASE = API_BASE.replace(/localhost|127\.0\.0\.1/, host);
    }
  }
} catch (e) {
  // ignore
}



const QUOTES = [
  "Donate blood — be someone's hero.",
  "A single donation can save up to three lives.",
  "Share life. Donate blood regularly.",
  "Blood donation: small time, huge impact.",
  "Heroes don't always wear capes — sometimes they're donors.",
  "Give blood, give hope.",
  "Your donation matters. Save a life.",
  "Keep calm and donate blood.",
  "Every drop counts — donate today.",
  "Be the reason someone lives tomorrow.",
  "Your kindness can save lives.",
  "Donate blood, be a life saver.",
  "Donate blood — be someone's hero.",
  "A single donation can save up to three lives.",
  "Share life. Donate blood regularly.",
  "Blood donation: small time, huge impact.",
  "Heroes don't always wear capes — sometimes they're donors.",
  "Give blood, give hope.",
  "Donate today — someone needs you tomorrow.",
  "Your donation matters. Save a life.",
  "Share the gift of life: donate blood.",
  "You are stronger than you think — donate.",
  "Blood donation is a simple act of kindness.",
  "One pint can make a big difference.",
  "Donors are lifelines for patients.",
  "Keep calm and donate blood.",
  "Every donor counts. Every drop matters.",
  "Donate blood — support your community.",
  "Make a date to donate regularly.",
  "Blood banks rely on people like you.",
  "Lifesaving action: roll up a sleeve.",
  "Your blood can give others a tomorrow.",
  "Donate to bring smiles back.",
  "A few minutes from you, a lifetime for someone.",
  "Donating blood is safe and quick.",
  "Every donation is a gift of life.",
  "Help patients fight critical illnesses.",
  "Your donation supports surgeries and emergencies.",
  "Heroes live among us — donors included.",
  "Give blood: it's priceless for recipients.",
  "Donate to help victims of accidents.",
  "Your type may be needed today.",
  "Donors help cancer patients receive treatment.",
  "Be kind: donate blood when you can.",
  "Blood donation unites communities.",
  "Be a regular donor — build a habit.",
  "Donating blood is an act of compassion.",
  "Donate and inspire others to do the same.",
  "Donations keep hospitals running.",
  "One donation — three potential lives saved.",
  "You can be somebody's miracle.",
  "Blood donation builds resilience in healthcare.",
  "Be the difference: donate blood.",
  "Your small act solves a big problem.",
  "Donors create second chances.",
  "Donate blood, spread hope.",
  "Be proud — you're saving lives.",
  "A hero step: share your blood.",
  "Donors are the backbone of transfusion care.",
  "Life is precious — donate to protect it.",
  "Regular donors protect the vulnerable.",
  "Blood donation empowers communities.",
  "Donate for family, friends, strangers.",
  "Every drop makes tomorrow possible.",
  "Your generosity heals wounds.",
  "Help mothers, children, accident victims.",
  "Make the world safer — donate.",
  "Donors give more than blood — they give hope.",
  "Join the movement of lifesavers.",
  "Donate to make hospitals prepared.",
  "Your type might be urgently needed.",
  "Donating is healthy, safe, and kind.",
  "Volunteer your time — donate blood.",
  "Donate today — be part of the solution.",
  "Blood donation creates positive change.",
  "Give life, get gratitude.",
  "Every donation counts toward recovery.",
  "Donors change stories from loss to life.",
  "Be generous — save someone's life.",
  "Community heroes donate regularly.",
  "Donating blood: quick, safe, rewarding.",
  "Your act echoes in families' lives.",
  "Donate for awareness and action.",
  "Fight shortages with your donation.",
  "Be a blood donor ambassador.",
  "Share your compassion: give blood.",
  "Simple act, profound result.",
  "Support your local blood bank.",
  "Donate blood — it's human kindness in action.",
  "Shed a little blood, save a lot of life.",
  "Donors are everyday heroes.",
  "Help keep surgery rooms ready.",
  "Your donation may help newborns.",
  "Be there for patients in need.",
  "Donations reduce crisis stress for responders.",
  "Help create a safer healthcare system.",
  "Donate once — you might save a stranger.",
  "It's easy to donate — do it safely.",
  "Strength is giving when you can.",
  "Your donation reduces suffering.",
  "Help restore hope through donation.",
  "Care, give, save.",
  "Be counted among lifesavers.",
  "Blood donors bring communities together.",
  "Your contribution is medical gold.",
  "Help ensure blood supply stability.",
  "Donate now — don't wait for an emergency.",
  "Blood donation renews life.",
  "Make donation part of your lifestyle.",
  "Blood saves families.",
  "Donors help create miracles every day.",
  "Show compassion — be a donor.",
  "Life is the best gift — share it.",
  "Be a beacon of hope — donate blood."
];

export default function Dashboard() {
  const { t } = useTranslation();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [active, setActive] = useState("dashboard");
  const isMobile = useMediaQuery("(max-width:900px)");
  const navigate = useNavigate();

  // Profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  const profileOpen = Boolean(anchorEl);

  // User data (LIVE)
  const [user, setUser] = useState(null);
  // modal/splash handling
  const [newUserLocal, setNewUserLocal] = useState(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [rewardNotification, setRewardNotification] = useState(null);

  // Quotes
  const [index, setIndex] = useState(0);

  // Loading state for user fetch
  const [loadingUser, setLoadingUser] = useState(true);

  // Emergency live requests
  const [loadingReq, setLoadingReq] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);

  // =============================
  // LOAD USER FROM BACKEND
  // =============================
  const loadUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/me`, {
        credentials: "include",
        headers: authUtils.getAuthHeaders(),
      });
      if (!res.ok) {
        console.warn("/api/user/me failed with status", res.status);
        if (res.status === 401) {
          authUtils.logout();
          navigate("/login");
        }
        setLoadingUser(false);
        return;
      }

      const data = await res.json();
      setUser(data);
      localStorage.setItem("userProfile", JSON.stringify(data)); // Cache user data
      setNotifications(data.notifications || []);

      // NEW: Push Notification Permission
      if (data?._id) {
        requestNotificationPermission().then(granted => {
          if (granted) {
            subscribeUserToPush(data._id);
          }
        });
      }


      // Check for recent reward notification
      if (data.notifications && data.notifications.length > 0) {
        const rewardNoti = data.notifications.find(n => n.type === 'reward' && !n.read);
        if (rewardNoti) {
          setRewardNotification(rewardNoti);
          setRewardDialogOpen(true);
        }
      }
      // determine whether to show new-user modal or returning-user splash
      try {
        // Check if profile is incomplete (missing phone or bloodGroup)
        const isProfileIncomplete = !data.phone || !data.bloodGroup;

        if (isProfileIncomplete) {
          // New User / Incomplete Profile -> Show Popup
          setShowNewUserModal(true);
        } else {
          // Existing User with complete profile -> Show Splash (once per session)
          const seen = sessionStorage.getItem("welcomeShown");
          if (!seen) {
            setShowWelcomeSplash(true);
            sessionStorage.setItem("welcomeShown", "1");
            setTimeout(() => setShowWelcomeSplash(false), 3000);
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error("loadUser error:", err);
    }
    setLoadingUser(false);
  };

  const loadRequests = async () => {
    setLoadingReq(true);
    try {
      const res = await fetch(`${API_BASE}/api/requests/recent`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // API returns a plain array (not { requests: [...] })
        setRecentRequests(Array.isArray(data) ? data : (data.requests || []));
      }
    } catch (err) {
      console.error("loadRequests error:", err);
    }
    setLoadingReq(false);
  };

  useEffect(() => {
    // Try to load from cache first for instant render
    try {
      const cached = localStorage.getItem("userProfile");
      if (cached) {
        setUser(JSON.parse(cached));
        setLoadingUser(false);
      }
    } catch (e) {
      // ignore
    }

    // Load user and requests immediately if logged in
    if (authUtils.isLoggedIn()) {
      loadUser();
      loadRequests();
    } else {
      navigate("/login");
    }

    const quoteInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length);
    }, 6000);

    // listen for profile updates from other pages (Profile saved)
    const onUpdated = () => loadUser();
    try { window.addEventListener('user-updated', onUpdated); } catch (e) { }

    return () => {
      try { window.removeEventListener('user-updated', onUpdated); } catch (e) { }
      clearInterval(quoteInterval);
    };
  }, []);

  // Helper functions
  const initials = (name) => (name ? name.charAt(0).toUpperCase() : "U");
  const handleLogout = () => {
    authUtils.logout();
    window.location.href = "/";
  };

  if (loadingUser) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b0b0b 0%, #151515 100%)",
        color: "#fff",
        overflowX: "hidden",
        maxWidth: "100vw",
      }}
    >
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
              {!user?.profilePhoto && initials(user?.name)}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
              <Typography variant="caption" sx={{ color: "#777" }}>{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* New user modal */}
      <Dialog open={showNewUserModal} onClose={() => setShowNewUserModal(false)}
        PaperProps={{ sx: { background: "#111", border: "1px solid rgba(255,43,43,0.2)", color: "#fff", borderRadius: 3 } }}>
        <DialogTitle sx={{ color: "#ff2b2b", fontWeight: 800 }}>{`Hello ${user?.name || 'Hero'} 👋`}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1, color: "#ccc" }}>{t('completeProfileMessage')}</Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1, p: 2 }}>
          <Button onClick={() => setShowNewUserModal(false)} sx={{ minHeight: 44, color: "#aaa" }}>{t('skip')}</Button>
          <Button onClick={() => { setShowNewUserModal(false); navigate('/profile'); }}
            sx={{ background: 'linear-gradient(135deg,#ff2b2b,#b60000)', color: '#fff', minHeight: 44, borderRadius: 2, px: 3 }}>
            {t('profile')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Welcome splash */}
      {showWelcomeSplash && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.96)' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Box sx={{ textAlign: 'center', color: '#fff', px: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#ff2b2b', letterSpacing: 2, textTransform: 'uppercase', fontSize: 13 }}>Welcome Back</Typography>
              <Box sx={{ width: 140, height: 140, borderRadius: '50%', mx: 'auto', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: "3px solid #ff2b2b", boxShadow: "0 0 40px rgba(255,43,43,0.4)", mb: 2 }}>
                {user?.profilePhoto
                  ? <img src={user.profilePhoto} alt="pf" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Avatar sx={{ width: 140, height: 140, bgcolor: '#ff2b2b', fontSize: '3rem', fontWeight: 900 }}>{initials(user?.name)}</Avatar>}
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>{user?.name || 'Friend'}</Typography>
              <Typography sx={{ color: '#ff4c4c', fontSize: 15 }}>{t('heroQuote')}</Typography>
            </Box>
          </motion.div>
        </Box>
      )}

      {/* Reward popup */}
      <Dialog open={rewardDialogOpen} onClose={() => setRewardDialogOpen(false)}
        PaperProps={{ sx: { background: "#111", border: "1px solid rgba(255,215,0,0.3)", color: "#fff", borderRadius: 3 } }}>
        <DialogTitle sx={{ color: "#ffd700", fontWeight: 800 }}>🏆 {t('achievements')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>{rewardNotification?.title || 'You received a reward'}</Typography>
          <Typography variant="body2" sx={{ color: "#aaa" }}>{rewardNotification?.body}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRewardDialogOpen(false)} sx={{ background: "rgba(255,215,0,0.1)", color: "#ffd700", borderRadius: 2, px: 3 }}>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BODY */}
      <Box sx={{ display: "flex", gap: 4, px: { xs: 2, md: 6 }, pb: 6 }}>

        {/* SIDEBAR */}
        {!isMobile && (
          <Box sx={{ width: 260, mt: 2 }}>
            <Box sx={{ position: "sticky", top: 24 }}><Sidebar /></Box>
          </Box>
        )}
        {isMobile && (
          <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)}>
            <Sidebar onClose={() => setOpenSidebar(false)} />
          </Drawer>
        )}

        {/* MAIN CONTENT */}
        <Box sx={{ flex: 1, pt: 3, minWidth: 0 }}>

          {/* ── HERO WELCOME BANNER ── */}
          <Box sx={{
            position: "relative",
            borderRadius: 4,
            overflow: "hidden",
            mb: 4,
            p: { xs: 3, md: 4 },
            background: "linear-gradient(135deg, #1a0000 0%, #2d0505 40%, #1a0000 100%)",
            border: "1px solid rgba(255,43,43,0.25)",
            boxShadow: "0 8px 48px rgba(255,43,43,0.12)",
          }}>
            {/* Glow orb */}
            <Box sx={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,43,43,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                <Avatar src={user?.profilePhoto}
                  sx={{ width: 68, height: 68, bgcolor: "#ff2b2b", fontSize: "1.8rem", fontWeight: 900, border: "3px solid rgba(255,43,43,0.5)", boxShadow: "0 0 24px rgba(255,43,43,0.35)" }}>
                  {!user?.profilePhoto && initials(user?.name)}
                </Avatar>
                <Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", mb: 0.3 }}>
                    Welcome back
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.4rem", md: "1.8rem" }, lineHeight: 1.1 }}>
                    {user?.name || "Hero"} 👋
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 0.8, flexWrap: "wrap" }}>
                    {user?.bloodGroup && (
                      <Chip label={`🩸 ${user.bloodGroup}`} size="small" sx={{ bgcolor: "rgba(255,43,43,0.2)", color: "#ff4c4c", fontWeight: 800, height: 22, fontSize: 11 }} />
                    )}
                    <Chip label="Real-Hero" size="small" sx={{ bgcolor: "rgba(255,43,43,0.1)", color: "rgba(255,255,255,0.6)", height: 22, fontSize: 11 }} />
                  </Box>
                </Box>
              </Box>

              {/* Mini stats */}
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {[
                  { label: "Coins", value: user?.coins || 0, icon: "🪙", color: "#ffd700" },
                  { label: "XP Points", value: user?.leaderboardPoints || 0, icon: "⭐", color: "#ff4c4c" },
                ].map((s) => (
                  <Box key={s.label} sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: s.color }}>
                      {s.icon} {s.value}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* ── QUICK ACTIONS ── */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 2, mb: 4 }}>
            {[
              { label: t('donateBlood') || "Donate Blood", icon: "🩸", path: "/donate", color: "#ff2b2b", bg: "rgba(255,43,43,0.1)", border: "rgba(255,43,43,0.25)" },
              { label: t('requestBlood') || "Request Blood", icon: "🏥", path: "/request", color: "#ff6b6b", bg: "rgba(255,107,107,0.08)", border: "rgba(255,107,107,0.2)" },
              { label: t('rewards') || "Rewards", icon: "🏆", path: "/rewards", color: "#ffd700", bg: "rgba(255,215,0,0.07)", border: "rgba(255,215,0,0.2)" },
              { label: t('leaderboard') || "Leaderboard", icon: "🥇", path: "/leaderboard", color: "#4fc3f7", bg: "rgba(79,195,247,0.07)", border: "rgba(79,195,247,0.2)" },
            ].map((action) => (
              <Box
                key={action.path}
                onClick={() => navigate(action.path)}
                sx={{
                  p: 2.5, borderRadius: 3, cursor: "pointer",
                  background: action.bg,
                  border: `1px solid ${action.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: `0 12px 32px ${action.border}` },
                }}
              >
                <Typography sx={{ fontSize: "2rem" }}>{action.icon}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: action.color, textAlign: "center" }}>{action.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* ── ANIMATED QUOTE ── */}
          <Box sx={{
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            mb: 4,
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            minHeight: 130,
            display: "flex", flexDirection: "column", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderRadius: "4px 0 0 4px", background: "linear-gradient(180deg,#ff2b2b,#b60000)" }} />
            <Typography sx={{ color: "rgba(255,43,43,0.6)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", mb: 1.5, pl: 2 }}>
              {t('yourImpact') || "Your Impact"}
            </Typography>
            <AnimatePresence mode="wait">
              <motion.div key={index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.45 }}>
                <Typography sx={{ color: "#f7f7f7", fontWeight: 500, lineHeight: 1.6, fontSize: { xs: "1rem", md: "1.2rem" }, pl: 2, pr: 2, fontStyle: "italic" }}>
                  "{QUOTES[index]}"
                </Typography>
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* ── MAP ── */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: 2, background: "#ff2b2b" }} />
              <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>
                {t('recentActivity') || "Live Activity Map"}
              </Typography>
            </Box>
            <MapComponent requests={recentRequests} userLocation={user?.location} />
          </Box>

          {/* ── LIVE EMERGENCY REQUESTS ── */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 4, height: 20, borderRadius: 2, background: "#ff2b2b" }} />
                <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>
                  {t('activeRequests') || "Active Blood Requests"}
                </Typography>
                {recentRequests.length > 0 && (
                  <Chip label={recentRequests.length} size="small" sx={{ bgcolor: "rgba(255,43,43,0.2)", color: "#ff4c4c", fontWeight: 900, height: 22, fontSize: 11 }} />
                )}
              </Box>
              <IconButton
                sx={{ color: "#ff2b2b", bgcolor: "rgba(255,43,43,0.08)", "&:hover": { bgcolor: "rgba(255,43,43,0.16)" }, borderRadius: 2 }}
                onClick={loadRequests}
              >
                <RefreshIcon />
              </IconButton>
            </Box>

            {loadingReq ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <CircularProgress color="error" />
              </Box>
            ) : recentRequests.length === 0 ? (
              <Box sx={{ p: 5, textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)" }}>
                <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>🩸</Typography>
                <Typography sx={{ color: "#bbb", fontWeight: 500 }}>{t('noRecentActivity') || "No active requests right now."}</Typography>
                <Typography sx={{ color: "#666", fontSize: 13, mt: 0.5 }}>Check back soon — heroes are always needed.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {recentRequests.map((r) => (
                  <Box
                    key={r._id}
                    sx={{
                      display: "flex", alignItems: "center", gap: 2,
                      p: 2, px: 2.5, borderRadius: 2.5,
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "background 0.2s, transform 0.2s",
                      "&:hover": { background: "rgba(255,43,43,0.06)", transform: "translateX(4px)", borderColor: "rgba(255,43,43,0.2)" },
                    }}
                  >
                    {/* Blood group badge */}
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2, flexShrink: 0,
                      background: "linear-gradient(135deg,#b71c1c,#ff2b2b)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(255,43,43,0.3)",
                    }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 13, color: "#fff", textAlign: "center", lineHeight: 1.2 }}>
                        {r.bloodGroup || "?"}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          {r.name}
                        </Typography>
                        {r.distanceKm && (
                          <Chip label={`📍 ${r.distanceKm} km away`} size="small" sx={{ height: 18, fontSize: 10, bgcolor: "rgba(255,255,255,0.05)", color: "#aaa" }} />
                        )}
                        {r.location?.lat && (
                          <Chip
                            label={`📍 ${parseFloat(r.location.lat).toFixed(3)}°N, ${parseFloat(r.location.lng).toFixed(3)}°E`}
                            size="small"
                            sx={{ height: 18, fontSize: 10, bgcolor: "rgba(79,195,247,0.08)", color: "#4fc3f7", border: "1px solid rgba(79,195,247,0.2)" }}
                          />
                        )}
                      </Box>
                      <Typography sx={{ color: "#777", fontSize: 12, mt: 0.2 }}>
                        {new Date(r.createdAt).toLocaleString()} {r.hospital && `• ${r.hospital}`}
                      </Typography>
                      {r.description && (
                        <Typography sx={{ fontSize: 12.5, color: "#bbb", mt: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.description}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      size="small"
                      onClick={() => navigate(`/donate?id=${r._id}`)}
                      sx={{
                        flexShrink: 0,
                        background: "linear-gradient(135deg,#ff2b2b,#b60000)",
                        color: "#fff", borderRadius: 2, px: 2, py: 0.7,
                        fontSize: 11, fontWeight: 700, textTransform: "none",
                        "&:hover": { background: "linear-gradient(135deg,#ff4c4c,#cc0000)", boxShadow: "0 4px 16px rgba(255,43,43,0.35)" },
                      }}
                    >
                      🩸 Help
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

        </Box>
      </Box>
    </Box>
  );
}
