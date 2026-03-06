import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function BloodDrop({ size = 40, color = "#ff2b2b" }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none">
      <path d="M20 2 C20 2 4 22 4 34 C4 43.9 11.2 50 20 50 C28.8 50 36 43.9 36 34 C36 22 20 2 20 2Z" fill={color} />
    </svg>
  );
}

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Swal.fire({
        title: "Feature Paused",
        text: "Password reset is temporarily unavailable during our security upgrade. Please contact support if you need immediate assistance.",
        icon: "info",
        confirmButtonColor: "#ff2b2b",
        background: "#111",
        color: "#fff",
      });
    }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#090909", fontFamily: "'Poppins', sans-serif", display: "flex", flexDirection: "column" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          padding: 14px 16px 14px 48px;
          color: #fff;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.25s, background 0.25s;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.28); }
        .auth-input:focus { border-color: rgba(255,43,43,0.6); background: rgba(255,255,255,0.09); }
        .auth-btn {
          width: 100%; padding: 14px; border-radius: 12px;
          background: linear-gradient(135deg, #ff2b2b, #b60000);
          color: #fff; font-family: 'Poppins', sans-serif;
          font-size: 15px; font-weight: 700; letter-spacing: 0.8px;
          border: none; cursor: pointer;
          box-shadow: 0 6px 24px rgba(255,43,43,0.4);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(255,43,43,0.55); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "15px 24px", borderBottom: "1px solid rgba(255,43,43,0.1)",
        background: "rgba(9,9,9,0.9)", backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
          <BloodDrop size={22} />
          <span style={{ color: "#ff2b2b", fontSize: 18, fontWeight: 800, textShadow: "0 0 14px rgba(255,43,43,0.5)" }}>
            Real<span style={{ color: "#fff" }}>-Hero</span>
          </span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
          Account Recovery
        </span>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 50% at 50% 42%, rgba(150,0,0,0.14) 0%, transparent 72%)", pointerEvents: "none" }} />

        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", right: "6%", top: "15%", opacity: 0.05, pointerEvents: "none" }}
        >
          <BloodDrop size={200} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2 }}
        >
          <div style={{
            background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24,
            padding: "40px 32px", boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{ display: "inline-flex", marginBottom: 14 }}
              >
                <span style={{ fontSize: 44 }}>🔑</span>
              </motion.div>
              <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Forgot Password?</h1>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13.5, margin: 0, lineHeight: 1.6 }}>
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, letterSpacing: 0.4 }}>EMAIL ADDRESS</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "rgba(255,43,43,0.7)", fontSize: 15, pointerEvents: "none" }}>✉</span>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <motion.div whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }} style={{ marginTop: 4 }}>
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "📧 Send Reset Link"}
                </button>
              </motion.div>
            </form>

            {/* Links */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  background: "transparent", border: "1.5px solid rgba(255,43,43,0.35)",
                  color: "#ff5a5a", fontFamily: "'Poppins', sans-serif",
                  fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.target.style.background = "rgba(255,43,43,0.1)"}
                onMouseLeave={e => e.target.style.background = "transparent"}
              >
                ← Back to Login
              </button>
              <button
                onClick={() => navigate("/register")}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  background: "transparent", border: "1.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.45)", fontFamily: "'Poppins', sans-serif",
                  fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.target.style.background = "transparent"}
              >
                Create Account
              </button>
            </div>
          </div>

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
