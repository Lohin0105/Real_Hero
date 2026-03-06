import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Card,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Drawer,
    IconButton,
    useMediaQuery,
    Avatar,
    Menu,
    MenuItem,

    Divider,
    Grid,
    Paper,
    Stack,
    Chip
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useNavigate } from 'react-router-dom';
import MenuIcon from "@mui/icons-material/Menu";
// removed other topbar icons — keep only profile/avatar
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
import { authUtils } from "../utils/auth";

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Donations() {
    const { t } = useTranslation();
    const [openSidebar, setOpenSidebar] = useState(false);
    const isMobile = useMediaQuery("(max-width:900px)");
    const [liveDonation, setLiveDonation] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dialogs
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);

    // Profile menu
    const [anchorEl, setAnchorEl] = useState(null);
    const profileOpen = Boolean(anchorEl);

    const [user, setUser] = useState(() => {
        try {
            const cached = localStorage.getItem("userProfile");
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            return null;
        }
    });

    const navigate = useNavigate();

    async function loadUser() {
        try {
            const headers = authUtils.getAuthHeaders();
            const res = await fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers });
            if (res.ok) {
                const u = await res.json();
                setUser(u);
                localStorage.setItem("userProfile", JSON.stringify(u));
                loadDonations(u);
                return;
            }
        } catch (e) {
            console.warn("User fetch failed", e);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadUser();
        const onAuth = () => loadUser();
        const onUpdated = () => loadUser();
        try { window.addEventListener('auth-changed', onAuth); window.addEventListener('user-updated', onUpdated); } catch (e) { }
        return () => { try { window.removeEventListener('auth-changed', onAuth); window.removeEventListener('user-updated', onUpdated); } catch (e) { } };
    }, []);

    const loadDonations = async (currentUser) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/requests/my-donations`, { headers: authUtils.getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                console.log('My donations data:', data);
                // Separate live vs history
                // Live = active or promoted (but NOT completed)
                // History = completed, fulfilled, cancelled, failed
                const active = data.find(d => ['active', 'promoted'].includes(d.status) && d.requestId && ['primary_assigned', 'backup_assigned', 'open'].includes(d.requestId.status));
                console.log('Active donation:', active);

                if (active) {
                    setLiveDonation({
                        ...active,
                        hospital: active.requestId.hospital,
                        patientName: active.requestId.name,
                        bloodGroup: active.requestId.bloodGroup,
                        role: active.role === 'primary' ? t('primaryDonor') : t('backupDonor')
                    });
                } else {
                    setLiveDonation(null);
                }

                const hist = data.filter(d => !active || d._id !== active._id).map(d => ({
                    ...d,
                    hospital: d.requestId?.hospital || d.hospital || 'Unknown',
                    date: new Date(d.updatedAt).toLocaleDateString(),
                    points: d.rewardPoints || 0,
                    status: d.status
                }));
                console.log('History donations:', hist);
                setHistory(hist);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleComplete = () => {
        setCompleteDialogOpen(true);
    };

    const confirmComplete = async () => {
        if (!liveDonation) return;
        console.log('Completing donation for request:', liveDonation.requestId._id);
        console.log('User UID:', user?.uid);
        try {
            const res = await fetch(`${API_BASE}/api/requests/complete/${liveDonation.requestId._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authUtils.getAuthHeaders()
                },
                body: JSON.stringify({ uid: user?.uid })
            });
            const data = await res.json();
            console.log('Complete donation response:', data);
            if (res.ok) {
                alert(t('donationCompletedMessage'));
                console.log('Reloading donations...');
                await loadDonations(user);
                console.log('Donations reloaded');
            } else {
                console.error('Error completing donation:', data);
                alert(`${t('error')}: ${data.error || t('failed')}`);
            }
        } catch (e) {
            console.error('Network error:', e);
            alert(t('networkError'));
        }
        setCompleteDialogOpen(false);
    };

    const handleCancel = () => {
        setCancelDialogOpen(true);
    };

    const confirmCancel = async () => {
        if (!liveDonation) return;
        try {
            const res = await fetch(`${API_BASE}/api/requests/cancel/${liveDonation.requestId._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authUtils.getAuthHeaders()
                },
                body: JSON.stringify({ uid: user?.uid })
            });
            if (res.ok) {
                alert(t('cancellationProcessedMessage'));
                loadDonations(user);
            } else {
                const err = await res.json();
                alert(`${t('error')}: ${err.error || t('failed')}`);
            }
        } catch (e) {
            alert(t('networkError'));
        }
        setCancelDialogOpen(false);
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b0b0b 0%, #151515 100%)", color: "#fff" }}>
            {/* TOP NAV */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2, md: 6 }, py: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpenSidebar(true)}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 800, textShadow: "0 0 18px rgba(255,20,20,0.85)", display: { xs: "none", md: "block" } }}>
                        {t('realHero')}
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* only profile avatar shown in navbar */}
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)" }}>{!user?.profilePhoto && (user?.name ? user.name.charAt(0).toUpperCase() : "U")}</Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}>
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
                            <Typography variant="caption" sx={{ color: "#777" }}>{user?.email}</Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
                            <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                            {t('profile')}
                        </MenuItem>
                        <MenuItem onClick={() => window.location.href = "/"}>
                            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                            {t('logout')}
                        </MenuItem>
                    </Menu>
                </Box>
            </Box >

            <Box sx={{ display: "flex", gap: 4, px: { xs: 2, md: 6 }, pb: 6 }}>
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

                <Box sx={{ flex: 1, pt: 3, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 900, mb: 4, textShadow: "0 0 20px rgba(255,43,43,0.3)" }}>
                        {t('heroJourney')}
                    </Typography>

                    <Grid container spacing={4} alignItems="stretch">
                        {/* Live Donations */}
                        <Grid item xs={12} sm={12} md={7}>
                            <Paper sx={{
                                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                                p: 4,
                                borderRadius: 4,
                                border: "1px solid rgba(255,255,255,0.1)",
                                backdropFilter: "blur(20px)",
                                boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                                height: '100%',
                                minHeight: 350,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Typography variant="h6" sx={{ color: "#ff2b2b", mb: 3, fontWeight: 800, letterSpacing: 1 }}>{t('activeMission').toUpperCase()}</Typography>
                                {loading ? (
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CircularProgress color="error" />
                                    </Box>
                                ) : liveDonation ? (
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ mb: 4 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#fff' }}>{liveDonation.hospital}</Typography>
                                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                                <Chip label={liveDonation.role} color="error" size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(255,43,43,0.2)' }} />
                                                <Chip label={liveDonation.bloodGroup} variant="outlined" size="small" sx={{ color: '#ff2b2b', borderColor: '#ff2b2b' }} />
                                            </Stack>
                                            <Typography variant="body1" sx={{ color: "#aaa" }}>
                                                {t('savingLifeOf')} <strong>{liveDonation.patientName}</strong>
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mt: 'auto', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                            <Button
                                                variant="contained"
                                                onClick={handleComplete}
                                                sx={{
                                                    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                                                    color: '#fff',
                                                    px: 4,
                                                    py: 1.5,
                                                    borderRadius: 3,
                                                    fontWeight: 800,
                                                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                                                    '&:hover': { transform: 'scale(1.02)', boxShadow: '0 6px 20px rgba(76, 175, 80, 0.5)' }
                                                }}
                                            >
                                                {t('missionAccomplished').toUpperCase()}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={handleCancel}
                                                sx={{
                                                    px: 3,
                                                    borderRadius: 3,
                                                    fontWeight: 700,
                                                    borderColor: 'rgba(255,43,43,0.3)',
                                                    '&:hover': { borderColor: '#ff2b2b', background: 'rgba(255,43,43,0.05)' }
                                                }}
                                            >
                                                {t('abortMission').toUpperCase()}
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, textAlign: 'center' }}>
                                        <Typography sx={{ color: "#aaa" }}>{t('noActiveMissions')}</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        {/* Donation History */}
                        <Grid item xs={12} sm={12} md={5}>
                            <Paper sx={{
                                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                                p: 4,
                                borderRadius: 4,
                                border: "1px solid rgba(255,255,255,0.1)",
                                backdropFilter: "blur(20px)",
                                boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                                height: '100%',
                                minHeight: 350,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Typography variant="h6" sx={{ color: "#aaa", mb: 3, fontWeight: 800, letterSpacing: 1 }}>{t('heroicHistory').toUpperCase()}</Typography>
                                {loading ? (
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CircularProgress color="error" />
                                    </Box>
                                ) : history.length > 0 ? (
                                    <Stack spacing={2} sx={{ flex: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' } }}>
                                        {history.map((h) => (
                                            <Box key={h._id}
                                                onClick={() => { setSelectedHistory(h); setHistoryDetailOpen(true); }}
                                                sx={{
                                                    p: 2.5, background: "rgba(255,255,255,0.02)",
                                                    borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)",
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    cursor: 'pointer', transition: 'all 0.2s',
                                                    '&:hover': { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(76,175,80,0.3)', transform: 'translateX(4px)' }
                                                }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{h.hospital}</Typography>
                                                    <Typography variant="caption" sx={{ color: "#aaa", display: 'block' }}>
                                                        {h.date} • <span style={{ color: h.status === 'completed' ? '#4caf50' : '#ff9800', fontWeight: 700 }}>{h.status?.toUpperCase()}</span>
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    {h.points > 0 && <Typography variant="subtitle2" sx={{ color: "#ffd54f", fontWeight: 900 }}>+{h.points} PTS</Typography>}
                                                    <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem' }}>tap for details</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                        <Typography sx={{ color: "#aaa" }}>{t('noPreviousMissions')}</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* Complete Dialog */}
            <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)}>
                <DialogTitle>{t('confirmCompletion')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('completionDialogMessage')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCompleteDialogOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={confirmComplete} variant="contained" color="success">
                        {t('confirm')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
                <DialogTitle>{t('cancelDonationTitle')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('cancelDonationMessage')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)}>{t('back')}</Button>
                    <Button onClick={confirmCancel} variant="contained" color="error">
                        {t('cancelDonation')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* History Detail Dialog */}
            <Dialog open={historyDetailOpen} onClose={() => setHistoryDetailOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg,#111 0%,#1a0a0a 100%)", border: "1px solid rgba(255,43,43,0.18)", borderRadius: 3, color: "#fff" } }}>
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <VolunteerActivismIcon sx={{ color: "#ff4a4a" }} />
                        <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>Donation Details</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setHistoryDetailOpen(false)} sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedHistory && (
                        <Grid container spacing={2}>
                            {[
                                { label: "Hospital", value: selectedHistory.hospital, icon: <LocalHospitalIcon />, color: "#ff4a4a" },
                                { label: "Patient Name", value: selectedHistory.patientName || selectedHistory.requestId?.name || "—", icon: <PersonIcon /> },
                                { label: "Blood Group", value: selectedHistory.bloodGroup || selectedHistory.requestId?.bloodGroup, icon: <BloodtypeIcon />, color: "#ff6b6b" },
                                { label: "Your Role", value: selectedHistory.role || (selectedHistory.status === 'completed' ? t('primaryDonor') : "Donor"), icon: <VolunteerActivismIcon />, color: "#42a5f5" },
                                { label: "Status", value: selectedHistory.status?.toUpperCase(), icon: <CheckCircleIcon />, color: selectedHistory.status === 'completed' ? "#4caf50" : "#ff9800" },
                                { label: "Date", value: selectedHistory.date || new Date(selectedHistory.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), icon: <AccessTimeIcon /> },
                            ].filter(i => i.value && i.value !== "—").map(item => (
                                <Grid item xs={12} sm={6} key={item.label}>
                                    <Box sx={{ background: "rgba(255,255,255,0.04)", borderRadius: 2, p: 2, border: "1px solid rgba(255,255,255,0.06)" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                            <Box sx={{ color: "#ff4a4a", fontSize: 14, display: "flex" }}>{item.icon}</Box>
                                            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{item.label}</Typography>
                                        </Box>
                                        <Typography sx={{ color: item.color || "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{item.value}</Typography>
                                    </Box>
                                </Grid>
                            ))}

                            {/* Rewards section */}
                            {(selectedHistory.points > 0 || selectedHistory.rewardPoints > 0) && (
                                <Grid item xs={12}>
                                    <Box sx={{ background: "rgba(255,213,79,0.07)", borderRadius: 2, p: 2.5, border: "1px solid rgba(255,213,79,0.18)", display: "flex", alignItems: "center", gap: 2 }}>
                                        <EmojiEventsIcon sx={{ color: "#ffd54f", fontSize: 36 }} />
                                        <Box>
                                            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.67rem", textTransform: "uppercase", letterSpacing: 1, mb: 0.3 }}>Rewards Earned</Typography>
                                            <Typography sx={{ color: "#ffd54f", fontWeight: 800, fontSize: "1.2rem" }}>
                                                +{selectedHistory.points || selectedHistory.rewardPoints} Hero Points
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}

                            {/* If no rewards yet */}
                            {!(selectedHistory.points > 0 || selectedHistory.rewardPoints > 0) && selectedHistory.status !== 'cancelled' && (
                                <Grid item xs={12}>
                                    <Box sx={{ background: "rgba(255,255,255,0.02)", borderRadius: 2, p: 2, border: "1px dashed rgba(255,255,255,0.08)", textAlign: "center" }}>
                                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                                            🕐 Rewards will be credited after requester confirms receipt.
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid rgba(255,255,255,0.06)", pt: 2 }}>
                    <Button onClick={() => setHistoryDetailOpen(false)} variant="outlined"
                        sx={{ color: "rgba(255,255,255,0.65)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "#fff" } }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

        </Box >
    );
}
