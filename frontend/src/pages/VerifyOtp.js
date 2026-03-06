import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { authUtils } from "../utils/auth";

/* ─── Blood Drop SVG ─── */
function BloodDrop({ size = 40, color = "#ff2b2b" }) {
    return (
        <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none">
            <path
                d="M20 2 C20 2 4 22 4 34 C4 43.9 11.2 50 20 50 C28.8 50 36 43.9 36 34 C36 22 20 2 20 2Z"
                fill={color}
            />
        </svg>
    );
}

export default function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    /* 6 individual digit slots */
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [verified, setVerified] = useState(false);

    const inputRefs = useRef([]);

    /* ── Pick up email from URL or localStorage ── */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailParam = params.get("email");
        if (emailParam) {
            setEmail(emailParam);
        } else {
            const saved = localStorage.getItem("newUserProfile");
            if (saved) {
                try { setEmail(JSON.parse(saved).email); } catch (_) { }
            }
        }
    }, [location]);

    /* ── Resend countdown ── */
    useEffect(() => {
        if (cooldown > 0) {
            const t = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [cooldown]);

    /* ── API base ── */
    const getApiBase = () => {
        let base = process.env.REACT_APP_API_BASE || "http://localhost:5000";
        if (typeof window !== "undefined") {
            const host = window.location.hostname;
            if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(base)) {
                base = base.replace(/localhost|127\.0\.0\.1/, host);
            }
        }
        return base;
    };

    /* ── Handle digit input ── */
    const handleDigit = (index, value) => {
        const char = value.replace(/\D/g, "").slice(-1);
        const next = [...digits];
        next[index] = char;
        setDigits(next);
        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    /* ── Backspace: move back ── */
    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    /* ── Paste: distribute across boxes ── */
    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const next = [...digits];
        for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
        setDigits(next);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const otp = digits.join("");

    /* ── Verify ── */
    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            return Swal.fire({ title: "Incomplete", text: "Please enter all 6 digits.", icon: "warning", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
        }
        setLoading(true);
        try {
            const res = await fetch(`${getApiBase()}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (res.ok) {
                authUtils.setToken(data.token, data.user);
                setVerified(true);
                setTimeout(() => navigate("/dashboard"), 1800);
            } else {
                Swal.fire({ title: "Error", text: data.message || "Verification failed", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
                setDigits(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch {
            Swal.fire({ title: "Network Error", text: "Could not connect to server", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
        } finally {
            setLoading(false);
        }
    };

    /* ── Resend ── */
    const handleResend = async () => {
        if (cooldown > 0) return;
        setResending(true);
        try {
            const res = await fetch(`${getApiBase()}/api/auth/resend-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setCooldown(60);
                setDigits(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
                Swal.fire({ title: "Code Sent!", text: "A new OTP was sent to your email.", icon: "success", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
            } else {
                Swal.fire({ title: "Error", text: data.message || "Failed to resend", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
            }
        } catch {
            Swal.fire({ title: "Error", text: "Network problem", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
        } finally {
            setResending(false);
        }
    };

    /* ─────────── RENDER ─────────── */
    return (
        <div style={{ minHeight: "100vh", background: "#090909", fontFamily: "'Poppins', sans-serif", display: "flex", flexDirection: "column" }}>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .otp-box {
          width: 52px;
          height: 60px;
          background: rgba(255,255,255,0.06);
          border: 2px solid rgba(255,255,255,0.10);
          border-radius: 14px;
          color: #fff;
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          outline: none;
          caret-color: #ff2b2b;
          transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;
          -moz-appearance: textfield;
        }
        .otp-box::-webkit-outer-spin-button,
        .otp-box::-webkit-inner-spin-button { -webkit-appearance: none; }
        .otp-box:focus {
          border-color: #ff2b2b;
          background: rgba(255,43,43,0.08);
          box-shadow: 0 0 0 3px rgba(255,43,43,0.18);
        }
        .otp-box.filled {
          border-color: rgba(255,43,43,0.5);
          background: rgba(255,43,43,0.06);
        }
        .otp-box.success {
          border-color: #22c55e;
          background: rgba(34,197,94,0.08);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
        }

        .verify-btn {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ff2b2b, #b60000);
          color: #fff;
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.8px;
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 24px rgba(255,43,43,0.4);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .verify-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(255,43,43,0.55);
        }
        .verify-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .resend-btn {
          background: none;
          border: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }

        @media (max-width: 420px) {
          .otp-box { width: 42px; height: 52px; font-size: 20px; border-radius: 10px; }
          .otp-row { gap: 8px !important; }
        }
      `}</style>

            {/* ── Navbar ── */}
            <nav style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 24px",
                borderBottom: "1px solid rgba(255,43,43,0.1)",
                background: "rgba(9,9,9,0.9)", backdropFilter: "blur(16px)",
                position: "sticky", top: 0, zIndex: 100,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
                    <BloodDrop size={22} />
                    <span style={{ color: "#ff2b2b", fontSize: 18, fontWeight: 800, textShadow: "0 0 14px rgba(255,43,43,0.5)" }}>
                        Real<span style={{ color: "#fff" }}>-Hero</span>
                    </span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 12 }}>
                    Step 2 of 2 — Verify Email
                </span>
            </nav>

            {/* ── Main ── */}
            <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "40px 20px", position: "relative", overflow: "hidden",
            }}>

                {/* Glow */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse 65% 50% at 50% 42%, rgba(150,0,0,0.15) 0%, transparent 72%)",
                    pointerEvents: "none",
                }} />

                {/* Decorative drops */}
                <motion.div
                    animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    style={{ position: "absolute", right: "5%", top: "12%", opacity: 0.05, pointerEvents: "none" }}
                >
                    <BloodDrop size={200} />
                </motion.div>
                <motion.div
                    animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ position: "absolute", left: "4%", bottom: "10%", opacity: 0.04, pointerEvents: "none" }}
                >
                    <BloodDrop size={160} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65 }}
                    style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 2 }}
                >

                    {/* ── Success State ── */}
                    {verified ? (
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                backdropFilter: "blur(20px)",
                                border: "1px solid rgba(34,197,94,0.3)",
                                borderRadius: 24,
                                padding: "52px 36px",
                                textAlign: "center",
                                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                style={{ fontSize: 64, marginBottom: 20 }}
                            >
                                ✅
                            </motion.div>
                            <h2 style={{ color: "#22c55e", fontSize: 26, fontWeight: 800, margin: "0 0 10px" }}>
                                Account Verified!
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: "0 0 6px" }}>
                                You're all set. Redirecting to your dashboard…
                            </p>
                            {/* progress line */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "60%" }}
                                transition={{ duration: 1.6, ease: "linear" }}
                                style={{ height: 3, background: "#22c55e", borderRadius: 3, margin: "24px auto 0" }}
                            />
                        </motion.div>
                    ) : (

                        /* ── Verify Card ── */
                        <div style={{
                            background: "rgba(255,255,255,0.04)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 24,
                            padding: "40px 32px",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
                        }}>

                            {/* Header */}
                            <div style={{ textAlign: "center", marginBottom: 32 }}>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.15, duration: 0.5 }}
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: 6,
                                        background: "rgba(255,43,43,0.1)", border: "1px solid rgba(255,43,43,0.25)",
                                        borderRadius: 50, padding: "6px 16px", marginBottom: 18,
                                    }}
                                >
                                    <span style={{ fontSize: 14 }}>📧</span>
                                    <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
                                        EMAIL VERIFICATION
                                    </span>
                                </motion.div>

                                <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.25 }}>
                                    Enter Your OTP
                                </h1>
                                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13.5, margin: 0, lineHeight: 1.6 }}>
                                    We sent a 6-digit code to
                                </p>
                                <p style={{ color: "#ff5a5a", fontSize: 13.5, fontWeight: 600, margin: "4px 0 0", wordBreak: "break-all" }}>
                                    {email || "your email"}
                                </p>
                            </div>

                            {/* OTP Boxes */}
                            <form onSubmit={handleVerify}>
                                <div
                                    className="otp-row"
                                    style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }}
                                >
                                    {digits.map((d, i) => (
                                        <motion.input
                                            key={i}
                                            ref={el => (inputRefs.current[i] = el)}
                                            className={`otp-box${d ? " filled" : ""}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={d}
                                            onChange={e => handleDigit(i, e.target.value)}
                                            onKeyDown={e => handleKeyDown(i, e)}
                                            onPaste={handlePaste}
                                            initial={{ opacity: 0, y: 14 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.08 * i, duration: 0.38 }}
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </div>

                                {/* Verify button */}
                                <motion.div whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }}>
                                    <button className="verify-btn" type="submit" disabled={loading || otp.length < 6}>
                                        {loading ? (
                                            <>
                                                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} style={{ display: "inline-block" }}>⟳</motion.span>
                                                Verifying…
                                            </>
                                        ) : (
                                            <>✓ Verify Account</>
                                        )}
                                    </button>
                                </motion.div>
                            </form>

                            {/* Resend */}
                            <div style={{ textAlign: "center", marginTop: 24 }}>
                                {cooldown > 0 ? (
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                        {/* Circular countdown */}
                                        <svg width={26} height={26} viewBox="0 0 26 26">
                                            <circle cx="13" cy="13" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                                            <motion.circle
                                                cx="13" cy="13" r="11"
                                                fill="none" stroke="#ff2b2b" strokeWidth="2"
                                                strokeDasharray={69.1}
                                                strokeDashoffset={69.1 * (1 - cooldown / 60)}
                                                strokeLinecap="round"
                                                style={{ transformOrigin: "center", rotate: "-90deg" }}
                                            />
                                            <text x="13" y="17" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="Poppins">{cooldown}</text>
                                        </svg>
                                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Resend in {cooldown}s</span>
                                    </div>
                                ) : (
                                    <div>
                                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Didn't receive it? </span>
                                        <button
                                            className="resend-btn"
                                            onClick={handleResend}
                                            disabled={resending}
                                            style={{ color: resending ? "rgba(255,90,90,0.4)" : "#ff5a5a" }}
                                        >
                                            {resending ? "Sending…" : "Resend Code"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                                <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 12 }}>or</span>
                                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                            </div>

                            {/* Different email */}
                            <div style={{ textAlign: "center" }}>
                                <button
                                    onClick={() => navigate("/register")}
                                    style={{
                                        background: "none", border: "1.5px solid rgba(255,255,255,0.1)",
                                        borderRadius: 10, color: "rgba(255,255,255,0.38)",
                                        fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500,
                                        cursor: "pointer", padding: "10px 20px", width: "100%",
                                        transition: "border-color 0.2s, color 0.2s",
                                    }}
                                    onMouseEnter={e => { e.target.style.borderColor = "rgba(255,43,43,0.35)"; e.target.style.color = "#ff5a5a"; }}
                                    onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.color = "rgba(255,255,255,0.38)"; }}
                                >
                                    ← Use a different email
                                </button>
                            </div>

                        </div>
                    )}

                    {/* Back to Home */}
                    <p style={{ textAlign: "center", marginTop: 18, fontSize: 12 }}>
                        <span
                            onClick={() => navigate("/")}
                            style={{ cursor: "pointer", color: "rgba(255,255,255,0.28)", transition: "color 0.2s" }}
                            onMouseEnter={e => e.target.style.color = "#ff5a5a"}
                            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.28)"}
                        >
                            ← Back to Home
                        </span>
                    </p>

                </motion.div>
            </div>
        </div>
    );
}
