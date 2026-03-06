import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Box, Typography, Card, CardContent, Grid, Avatar, Chip, IconButton, Menu, MenuItem, Divider, useMediaQuery, Drawer } from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { authUtils } from "../utils/auth";
import Sidebar from "../components/Sidebar";

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
try { if (typeof window !== 'undefined') { const host = window.location.hostname; if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(API_BASE)) API_BASE = API_BASE.replace(/localhost|127\.0\.0\.1/, host); } } catch (e) { }

export default function Gamification() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem("userProfile");
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [openSidebar, setOpenSidebar] = useState(false);
  const isMobile = useMediaQuery("(max-width:900px)");
  const profileOpen = Boolean(anchorEl);

  useEffect(() => {
    loadCurrentUser();
    loadLeaderboard();

    const onUpdated = () => loadCurrentUser();
    try { window.addEventListener('user-updated', onUpdated); } catch (e) { }

    return () => { try { window.removeEventListener('user-updated', onUpdated); } catch (e) { } };
  }, []);

  async function loadCurrentUser() {
    try {
      let headers = authUtils.getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/user/me`, { credentials: 'include', headers });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem("userProfile", JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to load current user', e);
    }
  }

  async function loadLeaderboard() {
    try {
      const res = await fetch(`${API_BASE}/api/user/leaderboard?limit=20`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setLeaders(data || []);
    } catch (e) {
      console.error('Leaderboard load failed', e);
    }
  }

  const getMedalIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return "#666";
  };

  const initials = (name) => (name ? name.charAt(0).toUpperCase() : "U");
  const handleLogout = () => (window.location.href = "/");

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg,#0b0b0b 0%,#151515 100%)", color: "#fff" }}>
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
            <Avatar src={currentUser?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)" }}>
              {!currentUser?.profilePhoto && initials(currentUser?.name)}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>{currentUser?.name}</Typography>
              <Typography variant="caption" sx={{ color: "#777" }}>{currentUser?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} /> {t('profile')}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
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
          <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 800, mb: 1 }}>
            {t('topHeroes')}
          </Typography>
          <Typography sx={{ color: "#bbb", mb: 4 }}>{t('topDonorsByPoints')}</Typography>

          {/* Top 3 Featured Section */}
          {top3.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2} alignItems="flex-end">
                {/* #1 Position - Featured Card */}
                {top3[0] && (
                  <Grid size={{ xs: 12, md: 12 }}>
                    <Card sx={{ background: "linear-gradient(135deg, #ff2b2b 0%, #bd1818 100%)", boxShadow: "0 20px 60px rgba(255,43,43,0.4)", border: "2px solid rgba(255,215,0,0.3)" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Box sx={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #FFA500)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", boxShadow: "0 8px 30px rgba(255,215,0,0.5)" }}>
                            🥇
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                              {top3[0].name || 'Unknown'}
                              {currentUser && currentUser._id === top3[0]._id && (
                                <Typography component="span" sx={{ ml: 1, color: "#FFD700" }}>({t('you')})</Typography>
                              )}
                            </Typography>
                            <Chip label={t('currentRealHero')} size="small" sx={{ bgcolor: "rgba(255,215,0,0.2)", color: "#FFD700", fontWeight: 600 }} />
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('points')}: {top3[0].leaderboardPoints || 0}</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('coins')}: {top3[0].coins || 0}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* #2 and #3 Positions */}
                {top3[1] && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ background: "rgba(192,192,192,0.1)", border: "2px solid rgba(192,192,192,0.3)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ width: 56, height: 56, bgcolor: getMedalColor(2), fontSize: "2rem" }}>{getMedalIcon(2)}</Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>#{2} {top3[1].name || 'Unknown'}</Typography>
                            <Typography variant="body2" sx={{ color: "#aaa" }}>{t('recentActivity')}: +{top3[1].donationsCount || 0}</Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography sx={{ fontWeight: 600 }}>🏆 {top3[1].leaderboardPoints || 0}</Typography>
                            <Typography sx={{ fontWeight: 600 }}>🪙 {top3[1].coins || 0}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {top3[2] && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ background: "rgba(205,127,50,0.1)", border: "2px solid rgba(205,127,50,0.3)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ width: 56, height: 56, bgcolor: getMedalColor(3), fontSize: "2rem" }}>{getMedalIcon(3)}</Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>#{3} {top3[2].name || 'Unknown'}</Typography>
                            <Typography variant="body2" sx={{ color: "#aaa" }}>{t('recentActivity')}: +{top3[2].donationsCount || 0}</Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography sx={{ fontWeight: 600 }}>🏆 {top3[2].leaderboardPoints || 0}</Typography>
                            <Typography sx={{ fontWeight: 600 }}>🪙 {top3[2].coins || 0}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Rest of Leaderboard */}
          {rest.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ color: "#ff2b2b", fontWeight: 700, mb: 2 }}>{t('otherTopDonors')}</Typography>
              {rest.map((u, i) => {
                const rank = i + 4;
                return (
                  <Card key={u._id} sx={{ background: "rgba(255,255,255,0.02)", mb: 1, border: currentUser && currentUser._id === u._id ? "2px solid #ff2b2b" : "none", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: "#333", width: 48, height: 48 }}>#{rank}</Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 700 }}>
                            {u.name || 'Unknown'}
                            {currentUser && currentUser._id === u._id && (
                              <Typography component="span" sx={{ ml: 1, color: "#ff2b2b" }}>({t('you')})</Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#777" }}>{t('donations')}: {u.donationsCount || 0}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography sx={{ fontWeight: 600, color: "#FFA500" }}>🏆 {u.leaderboardPoints || 0}</Typography>
                          <Typography sx={{ fontWeight: 600, color: "#FFD700" }}>🪙 {u.coins || 0}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {leaders.length === 0 && (
            <Typography sx={{ color: "#777", textAlign: "center", py: 4 }}>
              {t('noLeaderboardData')}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
