// frontend/src/pages/MediBotPage.js
import React, { useState, useRef, useEffect } from "react";
import {
    Box, Drawer, IconButton, Typography, Avatar, Divider,
    useMediaQuery, Menu, MenuItem, CircularProgress, InputBase, Tooltip, Chip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { authUtils } from "../utils/auth";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// Fixed pixel heights — used in both sx props and calc()
const NAV_H = 64;   // top app navbar
const BOT_H = 60;   // inner medibot header
const INPUT_H = 88;   // input bar + disclaimer text

export default function MediBotPage() {
    const { t } = useTranslation();
    const isMobile = useMediaQuery("(max-width:900px)");
    const navigate = useNavigate();

    const [openSidebar, setOpenSidebar] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessId, setCurrentSessId] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(!window.matchMedia("(max-width:900px)").matches);
    const [input, setInput] = useState("");
    const [imageBase64, setImageBase64] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const endRef = useRef(null);
    const fileRef = useRef(null);

    /* ── language change ─────────────────────────────────────────────── */
    useEffect(() => {
        setMessages(p => {
            const m = [...p];
            if (m[0]?.role === "assistant") m[0].content = t("mediBotIntro");
            return m;
        });
    }, [t]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    useEffect(() => { init(); }, []);

    /* ── init ────────────────────────────────────────────────────────── */
    async function init() {
        try {
            const h = authUtils.getAuthHeaders();
            const uRes = await fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers: h });
            if (uRes.ok) setUser(await uRes.json());
            const sRes = await fetch(`${API_BASE}/api/medibot/sessions`, { credentials: "include", headers: h });
            if (sRes.ok) setSessions(await sRes.json());
        } catch { }
        setMessages([{ role: "assistant", content: t("mediBotIntro") }]);
        setFetching(false);
    }

    /* ── session helpers ─────────────────────────────────────────────── */
    const loadSession = async (id) => {
        setFetching(true);
        try {
            const r = await fetch(`${API_BASE}/api/medibot/sessions/${id}`, { credentials: "include", headers: authUtils.getAuthHeaders() });
            if (r.ok) {
                const s = await r.json();
                setCurrentSessId(s._id);
                setMessages(s.messages?.length ? s.messages : [{ role: "assistant", content: t("mediBotIntro") }]);
            }
        } catch { } finally { setFetching(false); if (isMobile) setHistoryOpen(false); }
    };
    const newChat = () => { setCurrentSessId(null); setMessages([{ role: "assistant", content: t("mediBotIntro") }]); if (isMobile) setHistoryOpen(false); };
    const delSession = async (id, e) => {
        e.stopPropagation();
        const r = await fetch(`${API_BASE}/api/medibot/sessions/${id}`, { method: "DELETE", credentials: "include", headers: authUtils.getAuthHeaders() });
        if (r.ok) { setSessions(p => p.filter(s => s._id !== id)); if (currentSessId === id) newChat(); }
    };

    /* ── file / send ─────────────────────────────────────────────────── */
    const handleFile = (e) => {
        const f = e.target.files[0]; if (!f) return;
        const reader = new FileReader();
        reader.onloadend = () => setImageBase64(reader.result);
        reader.readAsDataURL(f);
    };
    const send = async () => {
        if ((!input.trim() && !imageBase64) || isLoading) return;
        setMessages(p => [...p, { role: "user", content: input, image: imageBase64 }]);
        const pay = { sessionId: currentSessId, message: input, image: imageBase64 };
        setInput(""); setImageBase64(""); setIsLoading(true);
        try {
            const r = await fetch(`${API_BASE}/api/medibot/chat`, { method: "POST", headers: { ...authUtils.getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(pay) });
            const d = await r.json();
            if (r.ok) {
                if (!currentSessId && d.session) { setCurrentSessId(d.session._id); setSessions(p => [d.session, ...p]); }
                setMessages(p => [...p, { role: "assistant", content: d.reply }]);
            } else { setMessages(p => [...p, { role: "assistant", content: d.error || "Error." }]); }
        } catch { setMessages(p => [...p, { role: "assistant", content: "Network error." }]); }
        setIsLoading(false);
    };

    const initials = (n) => n ? n[0].toUpperCase() : "U";
    const canSend = (input.trim() || imageBase64) && !isLoading;

    /* ─────────────────────────────────────── RENDER ─────────────────── */
    return (
        <Box sx={{ minHeight: "100vh", background: "#090909", color: "#fff", fontFamily: "'Poppins',sans-serif" }}>

            {/* ══ 1. TOP APP NAVBAR (sticky) ══════════════════════════════ */}
            <Box sx={{
                height: NAV_H, display: "flex", alignItems: "center",
                justifyContent: "space-between", px: { xs: 2, md: 4 },
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(9,9,9,0.97)", backdropFilter: "blur(14px)",
                position: "sticky", top: 0, zIndex: 300,
            }}>
                {/* left */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {isMobile && <IconButton sx={{ color: "#fff" }} onClick={() => setOpenSidebar(true)}><MenuIcon /></IconButton>}
                    <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#ff2b2b,#c62828)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px rgba(255,43,43,0.45)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    </Box>
                    <Typography sx={{ color: "#ff2b2b", fontWeight: 800, fontSize: "1.15rem", textShadow: "0 0 14px rgba(255,43,43,0.5)", letterSpacing: "-0.4px" }}>
                        Real-Hero
                    </Typography>
                </Box>
                {/* right */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Chip icon={<SmartToyIcon sx={{ fontSize: "13px !important", color: "#ff2b2b !important" }} />} label="MediBot AI" size="small"
                        sx={{ bgcolor: "rgba(255,43,43,0.07)", color: "#ff7070", fontWeight: 700, border: "1px solid rgba(255,43,43,0.18)", borderRadius: 2, fontSize: "0.68rem" }} />
                    <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.4)", width: 33, height: 33, fontSize: "0.82rem" }}>
                            {!user?.profilePhoto && initials(user?.name)}
                        </Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { background: "#181818", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2, color: "#fff", minWidth: 175 } }}>
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>{user?.name}</Typography>
                            <Typography variant="caption" sx={{ color: "#555" }}>{user?.email}</Typography>
                        </Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }} sx={{ gap: 1.5, fontSize: "0.875rem", color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
                            <AccountCircleIcon fontSize="small" /> Profile
                        </MenuItem>
                        <MenuItem onClick={() => { window.location.href = "/"; }} sx={{ gap: 1.5, fontSize: "0.875rem", color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,43,43,0.07)" } }}>
                            <LogoutIcon fontSize="small" /> Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* ══ 2. BODY (below sticky nav) ══════════════════════════════ */}
            {/*
                We deliberately do NOT use overflow:hidden here.
                Each column manages its own scroll/overflow internally.
            */}
            <Box sx={{ display: "flex", height: `calc(100vh - ${NAV_H}px)` }}>

                {/* Platform sidebar – desktop */}
                {!isMobile && (
                    <Box sx={{
                        width: 240, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", overflowY: "auto",
                        "&::-webkit-scrollbar": { width: 3 }, "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.06)" }
                    }}>
                        <Sidebar />
                    </Box>
                )}
                {/* Platform sidebar – mobile */}
                {isMobile && (
                    <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)} sx={{ "& .MuiDrawer-paper": { width: 260, background: "#0b0b0b" } }}>
                        <Sidebar onClose={() => setOpenSidebar(false)} />
                    </Drawer>
                )}

                {/* ══ 3. CHAT SHELL ════════════════════════════════════════ */}
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", background: "rgba(11,11,11,0.9)" }}>

                    {/* Chat history sidebar (collapsible) */}
                    {historyOpen && (
                        <Box sx={{ width: 240, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", background: "rgba(15,15,15,0.99)" }}>
                            <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <Box onClick={newChat} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, mb: 2, borderRadius: 2, cursor: "pointer", border: "1px solid rgba(255,43,43,0.22)", background: "rgba(255,43,43,0.04)", "&:hover": { background: "rgba(255,43,43,0.09)" } }}>
                                    <AddIcon fontSize="small" sx={{ color: "#ff2b2b" }} />
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>New Chat</Typography>
                                </Box>
                                <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.62rem", letterSpacing: 1.5, pl: 0.5 }}>Recent</Typography>
                                <Box sx={{ flex: 1, overflowY: "auto", mt: 0.5, display: "flex", flexDirection: "column", gap: 0.5, "&::-webkit-scrollbar": { width: 3 }, "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.07)" } }}>
                                    {sessions.length === 0
                                        ? <Typography sx={{ color: "rgba(255,255,255,0.18)", fontSize: "0.75rem", textAlign: "center", mt: 5 }}>No chats yet</Typography>
                                        : sessions.map(s => (
                                            <Box key={s._id} onClick={() => loadSession(s._id)} sx={{ display: "flex", alignItems: "center", p: 1.5, borderRadius: 2, cursor: "pointer", bgcolor: currentSessId === s._id ? "rgba(255,43,43,0.1)" : "transparent", "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
                                                <ChatBubbleOutlineIcon sx={{ fontSize: 13, color: currentSessId === s._id ? "#ff2b2b" : "rgba(255,255,255,0.35)", mr: 1.5, flexShrink: 0 }} />
                                                <Typography noWrap sx={{ flex: 1, fontSize: "0.8rem", color: currentSessId === s._id ? "#fff" : "rgba(255,255,255,0.65)" }}>{s.title}</Typography>
                                                <IconButton size="small" onClick={(e) => delSession(s._id, e)} sx={{ opacity: 0.25, color: "rgba(255,255,255,0.5)", "&:hover": { color: "#ff2b2b", opacity: 1 } }}>
                                                    <DeleteIcon sx={{ fontSize: 13 }} />
                                                </IconButton>
                                            </Box>
                                        ))}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* ══ 4. CHAT PANEL (position:relative → absolute children) ══ */}
                    <Box sx={{ flex: 1, minWidth: 0, position: "relative" }}>

                        {/* ── 4a. MediBot inner header ── PINNED to top ─────── */}
                        <Box sx={{
                            position: "absolute", top: 0, left: 0, right: 0,
                            height: BOT_H, zIndex: 10,
                            display: "flex", alignItems: "center",
                            px: 2,
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                            background: "rgba(13,13,13,0.98)",
                        }}>
                            <Tooltip title={historyOpen ? "Close history" : "Chat history"}>
                                <IconButton size="small" onClick={() => setHistoryOpen(!historyOpen)} sx={{ bgcolor: "rgba(255,255,255,0.04)", mr: 1.5, "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}>
                                    {historyOpen ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                            <Avatar sx={{ bgcolor: "rgba(255,43,43,0.12)", border: "1px solid rgba(255,43,43,0.28)", width: 34, height: 34, mr: 1.5 }}>
                                <SmartToyIcon sx={{ color: "#ff2b2b", fontSize: 18 }} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.2 }}>MediBot</Typography>
                                <Typography sx={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.33)" }}>Powered by AI · Blood Donation Specialist</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#4caf50", boxShadow: "0 0 5px #4caf50" }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.32)", fontSize: "0.67rem" }}>Active</Typography>
                            </Box>
                        </Box>

                        {/* ── 4b. Messages ── scrollable, below header, above input ── */}
                        <Box sx={{
                            position: "absolute",
                            top: BOT_H, bottom: INPUT_H, left: 0, right: 0,
                            overflowY: "auto", px: { xs: 2, md: 4 }, py: 2.5,
                            display: "flex", flexDirection: "column", gap: 2.5,
                            "&::-webkit-scrollbar": { width: 4 },
                            "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.06)", borderRadius: 10 },
                        }}>
                            {fetching
                                ? <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: "#ff2b2b" }} size={26} /></Box>
                                : messages.map((msg, i) => (
                                    <Box key={i} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 1.2 }}>
                                        {msg.role !== "user" && (
                                            <Avatar sx={{ bgcolor: "rgba(255,43,43,0.1)", border: "1px solid rgba(255,43,43,0.22)", width: 29, height: 29, flexShrink: 0, mt: 0.3 }}>
                                                <SmartToyIcon sx={{ color: "#ff2b2b", fontSize: 15 }} />
                                            </Avatar>
                                        )}
                                        <Box sx={{
                                            maxWidth: { xs: "88%", md: "70%" }, px: 2.2, py: 1.4,
                                            background: msg.role === "user" ? "linear-gradient(135deg,rgba(255,43,43,0.16),rgba(180,0,0,0.06))" : "rgba(255,255,255,0.026)",
                                            borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                            border: msg.role === "user" ? "1px solid rgba(255,43,43,0.18)" : "1px solid rgba(255,255,255,0.05)",
                                        }}>
                                            {msg.image && <Box sx={{ mb: 1, borderRadius: 2, overflow: "hidden" }}><img src={msg.image} alt="upload" style={{ maxWidth: "100%", maxHeight: 220, display: "block" }} /></Box>}
                                            <ReactMarkdown components={{
                                                p: ({ node, ...p }) => <p style={{ margin: "0 0 6px 0", color: "rgba(255,255,255,0.88)", fontSize: "0.89rem", lineHeight: 1.65 }} {...p} />,
                                                ul: ({ node, ...p }) => <ul style={{ marginLeft: 16, marginBottom: 6, color: "rgba(255,255,255,0.82)", fontSize: "0.87rem" }} {...p} />,
                                                li: ({ node, ...p }) => <li style={{ marginBottom: 3 }} {...p} />,
                                                strong: ({ node, ...p }) => <strong style={{ color: "#ff8a8a" }} {...p} />,
                                                code: ({ node, ...p }) => <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 5px", borderRadius: 3, fontSize: "0.81em" }} {...p} />,
                                            }}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </Box>
                                        {msg.role === "user" && (
                                            <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", width: 29, height: 29, flexShrink: 0, mt: 0.3 }}>
                                                {!user?.profilePhoto && initials(user?.name)}
                                            </Avatar>
                                        )}
                                    </Box>
                                ))
                            }
                            {isLoading && (
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                                    <Avatar sx={{ bgcolor: "rgba(255,43,43,0.1)", border: "1px solid rgba(255,43,43,0.22)", width: 29, height: 29, flexShrink: 0 }}>
                                        <SmartToyIcon sx={{ color: "#ff2b2b", fontSize: 15 }} />
                                    </Avatar>
                                    <Box sx={{ px: 2.2, py: 1.4, borderRadius: "16px 16px 16px 4px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.026)", display: "flex", gap: 0.6 }}>
                                        {[0, 1, 2].map(i => (
                                            <Box key={i} sx={{
                                                width: 6, height: 6, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.28)",
                                                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                                                "@keyframes bounce": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } }
                                            }} />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                            <div ref={endRef} />
                        </Box>

                        {/* ── 4c. Input bar ── PINNED to bottom ──────────────── */}
                        <Box sx={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            height: INPUT_H, zIndex: 10,
                            px: { xs: 2, md: 3 }, pt: 1, pb: 1.5,
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            background: "rgba(11,11,11,0.97)",
                            display: "flex", flexDirection: "column", justifyContent: "center",
                        }}>
                            {imageBase64 && (
                                <Box sx={{ mb: 0.8, display: "flex" }}>
                                    <Box sx={{ position: "relative", display: "inline-block" }}>
                                        <img src={imageBase64} alt="preview" style={{ height: 40, borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)" }} />
                                        <IconButton size="small" onClick={() => setImageBase64("")} sx={{ position: "absolute", top: -7, right: -7, bgcolor: "#ff2b2b", color: "white", width: 18, height: 18, "&:hover": { bgcolor: "#cc0000" } }}>
                                            <Box sx={{ fontSize: 12, fontWeight: "bold" }}>×</Box>
                                        </IconButton>
                                    </Box>
                                </Box>
                            )}
                            <Box sx={{
                                display: "flex", alignItems: "center", gap: 1, background: "rgba(22,22,22,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", px: 1.5, py: 0.4,
                                "&:focus-within": { borderColor: "rgba(255,43,43,0.38)", boxShadow: "0 0 0 2px rgba(255,43,43,0.05)" }
                            }}>
                                <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
                                <Tooltip title="Attach image">
                                    <IconButton size="small" onClick={() => fileRef.current.click()} sx={{ color: "rgba(255,255,255,0.28)", "&:hover": { color: "#fff" } }}>
                                        <AttachFileIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                                <InputBase
                                    placeholder={t("askMediBotPlaceholder") || "Ask about blood donation…"}
                                    multiline maxRows={3} value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                                    sx={{ flex: 1, color: "#fff", fontFamily: "'Poppins',sans-serif", fontSize: "0.88rem", py: 0.8 }}
                                />
                                <IconButton size="small" onClick={send} disabled={!canSend} sx={{ width: 32, height: 32, bgcolor: canSend ? "#ff2b2b" : "rgba(255,255,255,0.04)", color: canSend ? "#fff" : "rgba(255,255,255,0.18)", "&:hover": { bgcolor: canSend ? "#d42020" : "rgba(255,255,255,0.04)" }, transition: "all 0.2s" }}>
                                    <SendIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                            <Typography sx={{ textAlign: "center", fontSize: "0.63rem", color: "rgba(255,255,255,0.16)", mt: 0.6 }}>
                                MediBot can make mistakes. Verify critical medical information.
                            </Typography>
                        </Box>
                    </Box>
                    {/* end chat panel */}
                </Box>
                {/* end chat shell */}
            </Box>
            {/* end body */}
        </Box>
    );
}
