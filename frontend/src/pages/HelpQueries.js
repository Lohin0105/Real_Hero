import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Drawer, IconButton, useMediaQuery, Avatar, Menu, MenuItem, Divider, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useNavigate } from 'react-router-dom';
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { authUtils } from "../utils/auth";

export default function HelpQueries() {
    const { t } = useTranslation();
    const isMobile = useMediaQuery("(max-width:900px)");
    const navigate = useNavigate();

    const [openSidebar, setOpenSidebar] = useState(false);
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        try {
            const cached = localStorage.getItem("userProfile");
            if (cached) setUser(JSON.parse(cached));
        } catch (e) {}
    }, []);

    const initials = (n) => n ? n.split(" ").map(x => x[0]).join("").toUpperCase().slice(0, 2) : "U";

    const faqs = [
        {
            q: "I donated blood, but it is not showing up in My Donations?",
            a: "Donations are tracked in the 'My Donations' tab as 'Active'. They move to 'Completed' — and you receive Hero Points — only AFTER the requester confirms they have received the blood. If it has been a while, you can contact support."
        },
        {
            q: "How can I edit my profile or blood group?",
            a: "You can update your personal information by clicking on your avatar at the top right, then selecting 'Profile'. Here you can safely modify your Blood Group, Phone Number, and Location."
        },
        {
            q: "Is it safe to share my location for requests?",
            a: "Your precise location is safeguarded. We calculate distances to show you requests that are nearby, making it easier to save lives in your immediate community."
        },
        {
            q: "What do Hero Points or Rewards do?",
            a: "Hero points are awarded when you successfully fulfill a request. They move your rank up the Leaderboard and serve as a badge of honor for community heroes."
        }
    ];

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
                            <AccountCircleIcon fontSize="small" /> Profile
                        </MenuItem>
                        <MenuItem onClick={() => { authUtils.logout(); window.location.href="/"; }} sx={{ gap: 1, color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                            <LogoutIcon fontSize="small" /> Logout
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
                        <Sidebar onClose={() => setOpenSidebar(false)} />
                    </Drawer>
                )}

                <Box sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 0 }, pr: { md: 3 } }}>

                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}>
                            <HelpOutlineIcon sx={{ color: "#ff4c4c", fontSize: 32 }} />
                            <Typography variant="h4" sx={{ fontWeight: 800, background: "linear-gradient(90deg,#ff8a8a,#fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                Help & Queries
                            </Typography>
                        </Box>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem" }}>
                            Find answers to common questions or reach out to us directly.
                        </Typography>
                    </Box>

                    {/* FAQ Section */}
                    <Box sx={{ mb: 5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#fff" }}>Frequently Asked Questions</Typography>
                        {faqs.map((faq, idx) => (
                            <Accordion key={idx} sx={{ 
                                background: "rgba(255,255,255,0.03)", 
                                color: "#fff", 
                                border: "1px solid rgba(255,255,255,0.06)",
                                mb: 1,
                                "&:before": { display: "none" }
                            }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#ff4c4c" }} />} >
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>{faq.q}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                        {faq.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>

                    {/* Contact Support Section */}
                    <Box sx={{ p: { xs: 3, md: 4 }, background: "rgba(255,43,43,0.03)", borderRadius: 4, border: "1px solid rgba(255,43,43,0.15)", textAlign: "center" }}>
                        <EmailIcon sx={{ fontSize: 48, color: "rgba(255,43,43,0.5)", mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "#fff" }}>Still need help?</Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.5)", mb: 3, maxWidth: 500, mx: "auto" }}>
                            If you encountered a bug, an issue with fulfilling a request, or have any other inquiries, reach out to our team directly.
                        </Typography>
                        
                        <Button 
                            variant="contained" 
                            size="large"
                            startIcon={<EmailIcon />}
                            onClick={() => window.location.href = "mailto:lohinvemulapati@gmail.com?subject=Real-Hero%20Query"}
                            sx={{ 
                                background: "linear-gradient(135deg, #ff2b2b, #b60000)", 
                                color: "#fff", fontWeight: 700, px: 4, py: 1.5, borderRadius: 2,
                                textTransform: "none",
                                boxShadow: "0 8px 24px rgba(255,43,43,0.3)",
                                "&:hover": { background: "linear-gradient(135deg, #ff4c4c, #e60000)" }
                            }}
                        >
                            Email lohinvemulapati@gmail.com
                        </Button>
                    </Box>

                </Box>
            </Box>
        </Box>
    );
}
