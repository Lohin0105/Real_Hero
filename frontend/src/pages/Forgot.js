import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function BloodDrop({ size = 40, color = "#ff2b2b" }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none">
      <path d="M20 2 C20 2 4 22 4 34 C4 43.9 11.2 50 20 50 C28.8 50 36 43.9 36 34 C36 22 20 2 20 2Z" fill={color} />
    </svg>
  );
}

const API_BASE = (() => {
  let base = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(base)) {
      base = base.replace(/localhost|127\.0\.0\.1/, host);
    }
  }
  return base;
})();

export default function Forgot() {
  const navigate = useNavigate();

  // step: 1=email, 2=otp, 3=newPassword, 4=success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  // ── OTP box handlers ──
  const handleDigit = (index, value) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
  };
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };
  const otp = digits.join("");

  // ── Step 1: Send OTP ──
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setCooldown(60);
        setDigits(["", "", "", "", "", ""]);
        setStep(2);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        Swal.fire({ title: "Error", text: data.message || "Failed to send OTP", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
      }
    } catch {
      Swal.fire({ title: "Network Error", text: "Could not reach server", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password-otp`, {
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

  // ── Step 2: Verify OTP (just advance to step 3, actual reset uses OTP) ──
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return Swal.fire({ title: "Incomplete", text: "Please enter all 6 digits.", icon: "warning", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
    }
    setStep(3);
  };

  // ── Step 3: Reset Password ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return Swal.fire({ title: "Error", text: "Passwords do not match", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
    }
    if (newPassword.length < 6) {
      return Swal.fire({ title: "Error", text: "Password must be at least 6 characters", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(4);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        Swal.fire({ title: "Error", text: data.message || "Failed to reset password", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
        if (data.message?.toLowerCase().includes("otp")) setStep(2);
      }
    } catch {
      Swal.fire({ title: "Network Error", text: "Could not reach server", icon: "error", background: "#111", color: "#fff", confirmButtonColor: "#ff2b2b" });
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Enter Email", "Verify OTP", "New Password"];

  return (
    <div style={{ minHeight: "100vh", background: "#090909", fontFamily: "'Poppins', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .auth-input {
          width: 100%; background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.10); border-radius: 12px;
          padding: 14px 16px 14px 48px; color: #fff;
          font-family: 'Poppins', sans-serif; font-size: 14px; outline: none;
          transition: border-color 0.25s, background 0.25s;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.28); }
        .auth-input:focus { border-color: rgba(255,43,43,0.6); background: rgba(255,255,255,0.09); }
        .auth-input-plain {
          width: 100%; background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.10); border-radius: 12px;
          padding: 14px 48px 14px 16px; color: #fff;
          font-family: 'Poppins', sans-serif; font-size: 14px; outline: none;
          transition: border-color 0.25s, background 0.25s;
        }
        .auth-input-plain::placeholder { color: rgba(255,255,255,0.28); }
        .auth-input-plain:focus { border-color: rgba(255,43,43,0.6); background: rgba(255,255,255,0.09); }
        .auth-btn {
          width: 100%; padding: 14px; border-radius: 12px;
          background: linear-gradient(135deg, #ff2b2b, #b60000);
          color: #fff; font-family: 'Poppins', sans-serif;
          font-size: 15px; font-weight: 700; letter-spacing: 0.8px;
          border: none; cursor: pointer; box-shadow: 0 6px 24px rgba(255,43,43,0.4);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(255,43,43,0.55); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .otp-box {
          width: 50px; height: 58px; background: rgba(255,255,255,0.06);
          border: 2px solid rgba(255,255,255,0.10); border-radius: 12px;
          color: #fff; font-family: 'Poppins', sans-serif; font-size: 22px;
          font-weight: 700; text-align: center; outline: none; caret-color: #ff2b2b;
          transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;
          -moz-appearance: textfield;
        }
        .otp-box::-webkit-outer-spin-button, .otp-box::-webkit-inner-spin-button { -webkit-appearance: none; }
        .otp-box:focus { border-color: #ff2b2b; background: rgba(255,43,43,0.08); box-shadow: 0 0 0 3px rgba(255,43,43,0.18); }
        .otp-box.filled { border-color: rgba(255,43,43,0.5); background: rgba(255,43,43,0.06); }
        @media (max-width: 420px) { .otp-box { width: 40px; height: 48px; font-size: 18px; } }
      `}</style>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 24px", borderBottom: "1px solid rgba(255,43,43,0.1)", background: "rgba(9,9,9,0.9)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
          <BloodDrop size={22} />
          <span style={{ color: "#ff2b2b", fontSize: 18, fontWeight: 800, textShadow: "0 0 14px rgba(255,43,43,0.5)" }}>
            Real<span style={{ color: "#fff" }}>-Hero</span>
          </span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Account Recovery</span>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 50% at 50% 42%, rgba(150,0,0,0.14) 0%, transparent 72%)", pointerEvents: "none" }} />
        <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", right: "6%", top: "15%", opacity: 0.05, pointerEvents: "none" }}>
          <BloodDrop size={200} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2 }}>

          {/* Step indicator */}
          {step < 4 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 24 }}>
              {stepLabels.map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                      background: step > i + 1 ? "#22c55e" : step === i + 1 ? "linear-gradient(135deg,#ff2b2b,#b60000)" : "rgba(255,255,255,0.08)",
                      color: step >= i + 1 ? "#fff" : "rgba(255,255,255,0.3)",
                      boxShadow: step === i + 1 ? "0 0 12px rgba(255,43,43,0.5)" : "none",
                      transition: "all 0.3s"
                    }}>
                      {step > i + 1 ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: 10, color: step === i + 1 ? "#ff5a5a" : "rgba(255,255,255,0.3)", fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ width: 36, height: 1, background: step > i + 1 ? "#22c55e" : "rgba(255,255,255,0.1)", margin: "0 4px", marginBottom: 18, transition: "background 0.3s" }} />}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Step 4: Success ── */}
            {step === 4 && (
              <motion.div key="success" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 24, padding: "52px 36px", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} style={{ fontSize: 64, marginBottom: 20 }}>✅</motion.div>
                <h2 style={{ color: "#22c55e", fontSize: 24, fontWeight: 800, margin: "0 0 10px" }}>Password Reset!</h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>Redirecting to login…</p>
                <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ duration: 1.8, ease: "linear" }} style={{ height: 3, background: "#22c55e", borderRadius: 3, margin: "24px auto 0" }} />
              </motion.div>
            )}

            {/* ── Steps 1–3 Card ── */}
            {step < 4 && (
              <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "36px 32px", boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} style={{ display: "inline-flex", marginBottom: 12 }}>
                    <span style={{ fontSize: 40 }}>{step === 1 ? "🔑" : step === 2 ? "📧" : "🔒"}</span>
                  </motion.div>
                  <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
                    {step === 1 ? "Forgot Password?" : step === 2 ? "Enter Your OTP" : "Set New Password"}
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                    {step === 1 && "Enter your email, we'll send a verification code."}
                    {step === 2 && (<>We sent a 6-digit code to <span style={{ color: "#ff5a5a", fontWeight: 600 }}>{email}</span></>)}
                    {step === 3 && "Choose a strong new password for your account."}
                  </p>
                </div>

                {/* ── Step 1: Email ── */}
                {step === 1 && (
                  <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, letterSpacing: 0.4 }}>EMAIL ADDRESS</label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "rgba(255,43,43,0.7)", fontSize: 15, pointerEvents: "none" }}>✉</span>
                        <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }} style={{ marginTop: 4 }}>
                      <button className="auth-btn" type="submit" disabled={loading}>
                        {loading ? "Sending…" : "📤 Send Verification Code"}
                      </button>
                    </motion.div>
                  </form>
                )}

                {/* ── Step 2: OTP ── */}
                {step === 2 && (
                  <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
                      {digits.map((d, i) => (
                        <motion.input key={i} ref={el => (inputRefs.current[i] = el)}
                          className={`otp-box${d ? " filled" : ""}`}
                          type="text" inputMode="numeric" maxLength={1} value={d}
                          onChange={e => handleDigit(i, e.target.value)}
                          onKeyDown={e => handleKeyDown(i, e)}
                          onPaste={handlePaste}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      <button className="auth-btn" type="submit" disabled={otp.length < 6}>✓ Verify Code</button>
                    </motion.div>

                    {/* Resend */}
                    <div style={{ textAlign: "center", marginTop: 20 }}>
                      {cooldown > 0 ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <svg width={24} height={24} viewBox="0 0 26 26">
                            <circle cx="13" cy="13" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                            <motion.circle cx="13" cy="13" r="11" fill="none" stroke="#ff2b2b" strokeWidth="2"
                              strokeDasharray={69.1} strokeDashoffset={69.1 * (1 - cooldown / 60)} strokeLinecap="round"
                              style={{ transformOrigin: "center", rotate: "-90deg" }} />
                            <text x="13" y="17" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="Poppins">{cooldown}</text>
                          </svg>
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Resend in {cooldown}s</span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Didn't receive it? </span>
                          <button onClick={handleResend} disabled={resending} style={{ background: "none", border: "none", color: resending ? "rgba(255,90,90,0.4)" : "#ff5a5a", fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 }}>
                            {resending ? "Sending…" : "Resend Code"}
                          </button>
                        </div>
                      )}
                    </div>

                    <button type="button" onClick={() => { setStep(1); setDigits(["", "", "", "", "", ""]); }}
                      style={{ marginTop: 12, background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontFamily: "'Poppins', sans-serif", fontSize: 12, cursor: "pointer", padding: 0 }}>
                      ← Change email
                    </button>
                  </form>
                )}

                {/* ── Step 3: New Password ── */}
                {step === 3 && (
                  <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, letterSpacing: 0.4 }}>NEW PASSWORD</label>
                      <div style={{ position: "relative" }}>
                        <input className="auth-input-plain" type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, padding: 0 }}>
                          {showPass ? "🙈" : "👁"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, letterSpacing: 0.4 }}>CONFIRM PASSWORD</label>
                      <div style={{ position: "relative" }}>
                        <input className="auth-input-plain" type={showConfirm ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                          style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, padding: 0 }}>
                          {showConfirm ? "🙈" : "👁"}
                        </button>
                      </div>
                    </div>
                    {newPassword && confirmPassword && (
                      <p style={{ margin: 0, fontSize: 12, color: newPassword === confirmPassword ? "#22c55e" : "#ff5a5a" }}>
                        {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}
                    <motion.div whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }} style={{ marginTop: 4 }}>
                      <button className="auth-btn" type="submit" disabled={loading || (newPassword && confirmPassword && newPassword !== confirmPassword)}>
                        {loading ? "Resetting…" : "🔒 Reset Password"}
                      </button>
                    </motion.div>
                  </form>
                )}

                {/* Footer links (step 1 only) */}
                {step === 1 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>or</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => navigate("/login")} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "transparent", border: "1.5px solid rgba(255,43,43,0.35)", color: "#ff5a5a", fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
                        onMouseEnter={e => e.target.style.background = "rgba(255,43,43,0.1)"} onMouseLeave={e => e.target.style.background = "transparent"}>
                        ← Back to Login
                      </button>
                      <button onClick={() => navigate("/register")} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "transparent", border: "1.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }}
                        onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.target.style.background = "transparent"}>
                        Create Account
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 12 }}>
            <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "rgba(255,255,255,0.28)", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#ff5a5a"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.28)"}>
              ← Back to Home
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
