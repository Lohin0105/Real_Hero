import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';

/* ─── Blood Drop SVG ─── */
function BloodDrop({ size = 26 }) {
    return (
        <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none">
            <path d="M20 2 C20 2 4 22 4 34 C4 43.9 11.2 50 20 50 C28.8 50 36 43.9 36 34 C36 22 20 2 20 2Z" fill="#ff2b2b" />
        </svg>
    );
}

/* ─── Single nav item ─── */
const NavItem = ({ active, label, icon, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", padding: "11px 14px",
            borderRadius: 12, border: "none", cursor: "pointer",
            background: active ? "rgba(255,43,43,0.12)" : "transparent",
            borderLeft: active ? "3px solid #ff2b2b" : "3px solid transparent",
            transition: "background 0.2s, border-color 0.2s",
            marginBottom: 4,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
        <span style={{ color: active ? "#ff2b2b" : "rgba(255,255,255,0.45)", fontSize: 20, display: "flex", alignItems: "center", minWidth: 24 }}>
            {icon}
        </span>
        <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 13.5, fontWeight: active ? 700 : 500,
            color: active ? "#ff4c4c" : "rgba(255,255,255,0.72)",
            letterSpacing: 0.2,
        }}>
            {label}
        </span>
        {active && (
            <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#ff2b2b" }} />
        )}
    </button>
);

const SECTIONS = [
    { path: "/dashboard", icon: "⊞", key: "dashboard", fallback: "Dashboard" },
    { path: "/donate", icon: "🩸", key: "donateBlood", fallback: "Donate Blood" },
    { path: "/request", icon: "🏥", key: "requestBlood", fallback: "Request Blood" },
    { path: "/medibot", icon: "🤖", key: "medibotAI", fallback: "MediBot AI" },
];

const SECTIONS2 = [
    { path: "/requested-donations", icon: "📋", key: "myRequests", fallback: "My Requests" },
    { path: "/donations", icon: "💉", key: "myDonations", fallback: "My Donations" },
    { path: "/rewards", icon: "🏆", key: "rewards", fallback: "Rewards" },
    { path: "/analytics", icon: "📊", key: "analytics", fallback: "Analytics" },
    { path: "/leaderboard", icon: "🥇", key: "leaderboard", fallback: "Leaderboard" },
    { path: "/language", icon: "🌐", key: "languageSettings", fallback: "Language" },
    { path: "/about", icon: "👥", key: "aboutUs", fallback: "About Us" },
];

export default function Sidebar({ onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const active = location.pathname;

    const go = (path) => { navigate(path); if (onClose) onClose(); };

    return (
        <div style={{
            width: "100%", minWidth: 220,
            paddingTop: 20, paddingBottom: 20,
            paddingLeft: 12, paddingRight: 12,
            background: "rgba(9,9,9,0.97)",
            height: "calc(100vh - 0px)",
            borderRight: "1px solid rgba(255,43,43,0.1)",
            display: "flex", flexDirection: "column",
            overflowY: "auto",
        }}>

            {/* Logo */}
            <div
                style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 28, paddingLeft: 6, cursor: "pointer" }}
                onClick={() => go("/")}
            >
                <BloodDrop size={24} />
                <span style={{ color: "#ff2b2b", fontSize: 19, fontWeight: 800, letterSpacing: 0.3, textShadow: "0 0 14px rgba(255,43,43,0.45)", fontFamily: "'Poppins',sans-serif" }}>
                    Real<span style={{ color: "rgba(255,255,255,0.9)" }}>-Hero</span>
                </span>
            </div>

            {/* Section label */}
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.22)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, paddingLeft: 6, fontFamily: "Poppins" }}>
                Main
            </div>

            {SECTIONS.map(s => (
                <NavItem
                    key={s.path}
                    active={active === s.path}
                    label={t(s.key) || s.fallback}
                    icon={s.icon}
                    onClick={() => go(s.path)}
                />
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.22)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, paddingLeft: 6, fontFamily: "Poppins" }}>
                Activity
            </div>

            {SECTIONS2.map(s => (
                <NavItem
                    key={s.path}
                    active={active === s.path}
                    label={t(s.key) || s.fallback}
                    icon={s.icon}
                    onClick={() => go(s.path)}
                />
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.22)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, paddingLeft: 6, fontFamily: "Poppins" }}>
                Support
            </div>
            <NavItem
                active={active === "/help"}
                label="Help & Queries"
                icon="✉️"
                onClick={() => go("/help")}
            />

            {/* Bottom spacer */}
            <div style={{ flex: 1 }} />
        </div>
    );
}
