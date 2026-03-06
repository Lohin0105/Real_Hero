import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
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

/* ─── Inline input field ─── */
function Field({ label, name, type = "text", placeholder, icon, value, onChange, required, extra }) {
  return (
    <div>
      <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, letterSpacing: 0.4 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)",
          color: "rgba(255,43,43,0.7)", fontSize: 15, pointerEvents: "none",
        }}>{icon}</span>
        <input
          className="auth-input"
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={name}
        />
        {extra}
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Pre-warm the Render server as soon as the page loads
  // so it's ready by the time the user fills the form and clicks submit
  useEffect(() => {
    const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
    fetch(`${apiBase}/`, { method: "GET", signal: AbortSignal.timeout(90000) })
      .catch(() => { }); // silent — we don't care about errors, just waking the server
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWarmingUp(false);
    // Show "warming up" hint after 10s so user knows to keep waiting
    const warmTimer = setTimeout(() => setWarmingUp(true), 10000);
    try {
      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";

      // 70s timeout to handle Render free-tier cold start (~50-60s)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 70000);

      let res;
      try {
        res = await fetch(`${apiBase}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("newUserProfile", JSON.stringify({ email: form.email, name: form.name }));
        await Swal.fire({
          title: "OTP Sent! 📧",
          text: "Check your email for the 6-digit verification code.",
          icon: "success",
          confirmButtonColor: "#ff2b2b",
          background: "#111",
          color: "#fff",
          confirmButtonText: "Go to Verify →",
        });
        navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
      } else {
        Swal.fire({
          title: "Registration Failed",
          text: data.message || "Something went wrong. Please try again.",
          icon: "error",
          confirmButtonColor: "#ff2b2b",
          background: "#111",
          color: "#fff",
        });
      }
    } catch (err) {
      const isTimeout = err.name === "AbortError";
      Swal.fire({
        title: isTimeout ? "Server Still Waking Up ⏳" : "Connection Error",
        text: isTimeout
          ? "The server is taking longer than usual to start. Please click OK and try again — it should be ready now."
          : `Could not connect. Error: ${err.message}`,
        icon: "warning",
        confirmButtonColor: "#ff2b2b",
        background: "#111",
        color: "#fff",
        confirmButtonText: "OK, Try Again",
      });
    } finally {
      clearTimeout(warmTimer);
      setWarmingUp(false);
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
        .auth-input::placeholder { color: rgba(255,255,255,0.28); }
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
        .auth-link:hover { color: #ff8888; }

        .toggle-pass {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.32);
          cursor: pointer;
          font-size: 13px;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          transition: color 0.2s;
        }
        .toggle-pass:hover { color: rgba(255,255,255,0.7); }

        .strength-bar {
          height: 3px;
          border-radius: 4px;
          transition: width 0.4s, background 0.4s;
          margin-top: 6px;
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
          Already a hero?{" "}
          <Link to="/login" className="auth-link">Sign In</Link>
        </span>
      </nav>

      {/* ── Main ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "36px 20px", position: "relative", overflow: "hidden",
      }}>

        {/* Glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(160,0,0,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Decorative drop */}
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", left: "4%", bottom: "8%", opacity: 0.05, pointerEvents: "none" }}
        >
          <BloodDrop size={200} />
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
            padding: "36px 32px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(255,43,43,0.1)", border: "1px solid rgba(255,43,43,0.25)",
                  borderRadius: 50, padding: "6px 16px", marginBottom: 16,
                }}
              >
                <BloodDrop size={16} />
                <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
                  JOIN THE MOVEMENT
                </span>
              </motion.div>
              <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.2 }}>
                Create Your Account
              </h1>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13.5, margin: 0 }}>
                Start saving lives today — it's free
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Full Name */}
              <Field
                label="FULL NAME"
                name="name"
                placeholder="Your full name"
                icon="👤"
                value={form.name}
                onChange={update}
                required
              />

              {/* Email */}
              <Field
                label="EMAIL ADDRESS"
                name="email"
                type="email"
                placeholder="you@example.com"
                icon="✉"
                value={form.email}
                onChange={update}
                required
              />

              {/* Password */}
              <div>
                <label style={{ color: "rgba(255,255,255,0.52)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, letterSpacing: 0.4 }}>
                  PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "rgba(255,43,43,0.7)", fontSize: 15, pointerEvents: "none" }}>🔒</span>
                  <input
                    className="auth-input"
                    type={showPass ? "text" : "password"}
                    name="password"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={update}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {[1, 2, 3, 4].map(i => {
                      const strength = form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3;
                      const colors = ["", "#ff4444", "#ff8c00", "#f0c020", "#22c55e"];
                      return (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 3,
                          background: i <= strength ? colors[strength] : "rgba(255,255,255,0.1)",
                          transition: "background 0.3s",
                        }} />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit */}
              <motion.div whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }} style={{ marginTop: 6 }}>
                <button className="auth-btn-primary" type="submit" disabled={loading}>
                  {loading
                    ? warmingUp
                      ? "⏳ Server warming up… please wait"
                      : "Creating account…"
                    : "🩸 Create Free Account"}
                </button>
              </motion.div>

              {/* Agree note */}
              <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 11.5, textAlign: "center", margin: 0, lineHeight: 1.65 }}>
                By registering, you agree to our terms and confirm you're eligible to donate blood.
              </p>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Login CTA */}
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13.5, margin: "0 0 12px" }}>
                Already have an account?
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    width: "100%", padding: "13px",
                    borderRadius: 12,
                    background: "transparent",
                    border: "1.5px solid rgba(255,43,43,0.38)",
                    color: "#ff5a5a",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={e => { e.target.style.background = "rgba(255,43,43,0.1)"; e.target.style.borderColor = "rgba(255,43,43,0.65)"; }}
                  onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(255,43,43,0.38)"; }}
                >
                  Sign In to Real-Hero →
                </button>
              </motion.div>
            </div>

          </div>

          {/* Back */}
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 12 }}>
            <span
              onClick={() => navigate("/")}
              style={{ cursor: "pointer", color: "rgba(255,255,255,0.3)", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#ff5a5a"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
            >
              ← Back to Home
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
