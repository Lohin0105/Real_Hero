import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authUtils } from "../utils/auth";

/* ─── Blood Drop SVG (matches homepage) ─── */
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

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(apiBase)) {
          apiBase = apiBase.replace(/localhost|127\.0\.0\.1/, host);
        }
      }
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        authUtils.setToken(data.token, data.user);
        navigate("/dashboard");
      } else if (res.status === 403 && data.isVerified === false) {
        Swal.fire("Not Verified", data.message, "warning").then(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        });
      } else {
        Swal.fire("Login Failed", data.message || "Invalid credentials", "error");
      }
    } catch {
      Swal.fire("Error", "Auth server unreachable", "error");
    } finally {
      setLoading(false);
    }
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
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .auth-input:focus {
          border-color: rgba(255,43,43,0.6);
          background: rgba(255,255,255,0.09);
        }

        .auth-btn-primary {
          width: 100%;
          padding: 14px;
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
        }
        .auth-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(255,43,43,0.55);
        }
        .auth-btn-primary:active { transform: translateY(0); }
        .auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .auth-link {
          color: #ff5a5a;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .auth-link:hover { color: #ff8080; }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,43,43,0.7);
          font-size: 16px;
          pointer-events: none;
        }
        .toggle-pass {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          transition: color 0.2s;
        }
        .toggle-pass:hover { color: rgba(255,255,255,0.7); }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.18);
          font-size: 12px;
          margin: 4px 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
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
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
          No account?{" "}
          <Link to="/register" className="auth-link">Register free</Link>
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
          background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(160,0,0,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Decorative drop */}
        <motion.div
          animate={{ y: [0, -16, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", right: "6%", top: "10%", opacity: 0.05, pointerEvents: "none" }}
        >
          <BloodDrop size={220} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 2 }}
        >
          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: "40px 36px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                style={{ display: "inline-flex", marginBottom: 14 }}
              >
                <BloodDrop size={38} />
              </motion.div>
              <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.2 }}>
                Welcome Back
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13.5, margin: 0 }}>
                Sign in to your Real-Hero account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Email */}
              <div>
                <label style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, letterSpacing: 0.4 }}>
                  EMAIL ADDRESS
                </label>
                <div style={{ position: "relative" }}>
                  <span className="input-icon">✉</span>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 500, letterSpacing: 0.4 }}>
                    PASSWORD
                  </label>
                  <Link to="/forgot" className="auth-link" style={{ fontSize: 12 }}>Forgot password?</Link>
                </div>
                <div style={{ position: "relative" }}>
                  <span className="input-icon">🔒</span>
                  <input
                    className="auth-input"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.div whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }} style={{ marginTop: 4 }}>
                <button className="auth-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Signing in…" : "Sign In →"}
                </button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="divider" style={{ margin: "24px 0" }}>or</div>

            {/* Register CTA */}
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13.5, margin: "0 0 14px" }}>
                New to Real-Hero?
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <button
                  onClick={() => navigate("/register")}
                  style={{
                    width: "100%", padding: "13px",
                    borderRadius: 12,
                    background: "transparent",
                    border: "1.5px solid rgba(255,43,43,0.4)",
                    color: "#ff5a5a",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={e => { e.target.style.background = "rgba(255,43,43,0.1)"; e.target.style.borderColor = "rgba(255,43,43,0.7)"; }}
                  onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(255,43,43,0.4)"; }}
                >
                  🩸 Create Free Account
                </button>
              </motion.div>
            </div>

          </div>

          {/* Back link */}
          <p style={{ textAlign: "center", marginTop: 20, color: "rgba(255,255,255,0.22)", fontSize: 12 }}>
            <span
              onClick={() => navigate("/")}
              style={{ cursor: "pointer", color: "rgba(255,255,255,0.35)", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#ff5a5a"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.35)"}
            >
              ← Back to Home
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
