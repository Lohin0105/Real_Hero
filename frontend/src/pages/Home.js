import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";

/* ─── Animated Counter ─── */
function Counter({ target, suffix = "" }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
        }, 24);
        return () => clearInterval(timer);
    }, [inView, target]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Blood Drop SVG ─── */
function BloodDrop({ size = 40, color = "#ff2b2b" }) {
    return (
        <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none">
            <path d="M20 2 C20 2 4 22 4 34 C4 43.9 11.2 50 20 50 C28.8 50 36 43.9 36 34 C36 22 20 2 20 2Z" fill={color} />
        </svg>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const stats = [
        { label: "Lives Saved", value: 12800, suffix: "+" },
        { label: "Registered Donors", value: 45000, suffix: "+" },
        { label: "Cities Covered", value: 120, suffix: "+" },
        { label: "Requests Fulfilled", value: 9300, suffix: "+" },
    ];

    const features = [
        { icon: "🩸", title: "Instant Matching", desc: "AI-powered system instantly connects patients with nearest compatible donors, saving critical minutes." },
        { icon: "📍", title: "Real-Time Location", desc: "Live maps show donors and recipients near you so help arrives faster than ever." },
        { icon: "🏆", title: "Gamified Giving", desc: "Earn badges, climb leaderboards, and unlock rewards for every donation you make." },
        { icon: "🤖", title: "MediBot AI", desc: "24/7 medical assistant answers donation questions and eligibility checks." },
        { icon: "🔔", title: "Urgent Alerts", desc: "Get notified instantly when someone nearby urgently needs your blood type." },
        { icon: "📊", title: "Health Analytics", desc: "Track your donation history, impact, and contribution to the community." },
    ];

    const steps = [
        { num: "01", title: "Register Free", desc: "Create your Real-Hero profile in under 2 minutes." },
        { num: "02", title: "Set Blood Type", desc: "Complete your profile with blood group and location." },
        { num: "03", title: "Get Matched", desc: "Receive alerts when someone nearby needs your blood type." },
        { num: "04", title: "Save a Life", desc: "Donate and earn rewards — you're the real hero." },
    ];

    const bloodTypes = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

    const scrollTo = (id) => {
        setMenuOpen(false);
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    return (
        <div style={{ background: "#090909", minHeight: "100vh", fontFamily: "'Poppins', sans-serif", overflowX: "hidden" }}>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #ff2b2b; border-radius: 3px; }

        /* ── Buttons ── */
        .btn-primary {
          display: inline-block;
          padding: 14px 36px;
          border-radius: 50px;
          background: linear-gradient(135deg, #ff2b2b, #b60000);
          color: #fff;
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          letter-spacing: 0.8px;
          box-shadow: 0 8px 28px rgba(255,43,43,0.45);
          transition: transform 0.2s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 14px 38px rgba(255,43,43,0.6); }
        .btn-primary:active { transform: translateY(0); }

        .btn-secondary {
          display: inline-block;
          padding: 13px 36px;
          border-radius: 50px;
          background: transparent;
          color: #ff4c4c;
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: 2px solid #ff2b2b;
          letter-spacing: 0.8px;
          transition: background 0.2s, transform 0.2s;
          white-space: nowrap;
        }
        .btn-secondary:hover { background: rgba(255,43,43,0.12); transform: translateY(-3px); }
        .btn-secondary:active { transform: translateY(0); }

        /* ── Nav ── */
        .nav-link {
          color: rgba(255,255,255,0.72);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          background: none;
          border: none;
          font-family: 'Poppins', sans-serif;
          padding: 0;
        }
        .nav-link:hover { color: #ff4c4c; }

        /* ── Cards ── */
        .stat-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255,43,43,0.18);
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
        }
        .stat-card:hover { transform: translateY(-6px); box-shadow: 0 18px 48px rgba(255,43,43,0.2); border-color: rgba(255,43,43,0.5); }

        .feature-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 32px 24px;
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
        }
        .feature-card:hover { transform: translateY(-8px); box-shadow: 0 20px 55px rgba(255,43,43,0.18); border-color: rgba(255,43,43,0.35); }

        .step-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,43,43,0.12);
          border-radius: 20px;
          padding: 28px 20px;
          transition: transform 0.3s, border-color 0.3s;
        }
        .step-card:hover { transform: translateY(-5px); border-color: rgba(255,43,43,0.4); }

        .blood-badge {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(255,43,43,0.1);
          border: 2px solid rgba(255,43,43,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 700;
          color: #ff4c4c;
          font-family: 'Poppins', sans-serif;
          transition: background 0.3s, border-color 0.3s, transform 0.3s;
        }
        .blood-badge:hover { background: rgba(255,43,43,0.25); border-color: #ff2b2b; transform: scale(1.14); }

        /* ── Mobile menu overlay ── */
        .mobile-menu {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(6,6,6,0.97);
          z-index: 999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 36px;
          backdrop-filter: blur(12px);
        }
        .mobile-menu-link {
          color: #fff;
          font-size: 22px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          background: none;
          border: none;
          transition: color 0.2s;
        }
        .mobile-menu-link:hover { color: #ff4c4c; }

        /* ── Hamburger ── */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          background: none;
          border: none;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: transform 0.3s, opacity 0.3s;
        }

        /* ── Section headings responsiveness ── */
        .section-title { font-size: 38px; }
        .hero-h1 { font-size: 64px; }
        .hero-sub { font-size: 17px; }
        .cta-h2 { font-size: 44px; }

        /* ── Grids ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .blood-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 18px;
        }

        /* ─── TABLET ≤ 900px ─── */
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .section-title { font-size: 30px; }
          .hero-h1 { font-size: 50px; }
          .cta-h2 { font-size: 34px; }
        }

        /* ─── MOBILE ≤ 600px ─── */
        @media (max-width: 600px) {
          .hamburger { display: flex; }
          .nav-desktop-links { display: none !important; }
          .nav-desktop-buttons { display: none !important; }

          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; }

          .hero-h1 { font-size: 36px !important; line-height: 1.2 !important; }
          .hero-sub { font-size: 15px !important; }
          .section-title { font-size: 26px !important; }
          .cta-h2 { font-size: 28px !important; }

          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns .btn-primary,
          .hero-btns .btn-secondary { width: 100% !important; text-align: center !important; padding: 15px 20px !important; }

          .cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .cta-btns .btn-primary,
          .cta-btns .btn-secondary { width: 100% !important; text-align: center !important; }

          .blood-badge { width: 60px; height: 60px; font-size: 15px; }
          .blood-grid { gap: 12px; }

          .stat-card { padding: 22px 14px; }
          .feature-card { padding: 24px 18px; }
          .step-card { padding: 22px 16px; }

          .hero-badge-text { font-size: 11px !important; letter-spacing: 0.5px !important; }
          .testimonial-quote { font-size: 16px !important; }
        }

        /* ─── SMALL MOBILE ≤ 380px ─── */
        @media (max-width: 380px) {
          .hero-h1 { font-size: 30px !important; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

            {/* ══ MOBILE MENU OVERLAY ══ */}
            {menuOpen && (
                <div className="mobile-menu">
                    <div style={{ position: "absolute", top: 18, right: 20 }}>
                        <button
                            onClick={() => setMenuOpen(false)}
                            style={{ background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", lineHeight: 1 }}
                        >✕</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <BloodDrop size={26} /><span style={{ color: "#ff2b2b", fontSize: 22, fontWeight: 800 }}>Real<span style={{ color: "#fff" }}>-Hero</span></span>
                    </div>
                    {[
                        { label: "How It Works", id: "how-it-works" },
                        { label: "Features", id: "features" },
                        { label: "Blood Types", id: "blood-types" },
                    ].map(item => (
                        <button key={item.id} className="mobile-menu-link" onClick={() => scrollTo(item.id)}>{item.label}</button>
                    ))}
                    <button className="mobile-menu-link" onClick={() => { setMenuOpen(false); navigate("/about"); }}>Meet the Team</button>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 220 }}>
                        <button className="btn-secondary" style={{ width: "100%", textAlign: "center" }} onClick={() => { setMenuOpen(false); navigate("/login"); }}>Login</button>
                        <button className="btn-primary" style={{ width: "100%", textAlign: "center" }} onClick={() => { setMenuOpen(false); navigate("/register"); }}>Join Free 🩸</button>
                    </div>
                </div>
            )}

            {/* ══ NAVBAR ══ */}
            <motion.nav
                initial={{ y: -56, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.55 }}
                style={{
                    position: "fixed", top: 0, left: 0, right: 0, zIndex: 900,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 24px",
                    background: "rgba(9,9,9,0.88)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(255,43,43,0.12)",
                }}
            >
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
                    <BloodDrop size={26} />
                    <span style={{ color: "#ff2b2b", fontSize: 20, fontWeight: 800, letterSpacing: 0.4, textShadow: "0 0 16px rgba(255,43,43,0.55)" }}>
                        Real<span style={{ color: "#fff" }}>-Hero</span>
                    </span>
                </div>

                {/* Desktop nav links */}
                <div className="nav-desktop-links" style={{ display: "flex", gap: 34 }}>
                    {[
                        { label: "How It Works", id: "how-it-works" },
                        { label: "Features", id: "features" },
                        { label: "Blood Types", id: "blood-types" },
                    ].map(item => (
                        <button key={item.id} className="nav-link" onClick={() => scrollTo(item.id)}>{item.label}</button>
                    ))}
                    <button className="nav-link" onClick={() => navigate("/about")}>Meet the Team</button>
                </div>

                {/* Desktop auth buttons */}
                <div className="nav-desktop-buttons" style={{ display: "flex", gap: 10 }}>
                    <button className="btn-secondary" style={{ padding: "9px 22px", fontSize: 13 }} onClick={() => navigate("/login")}>Login</button>
                    <button className="btn-primary" style={{ padding: "9px 22px", fontSize: 13 }} onClick={() => navigate("/register")}>Join Free</button>
                </div>

                {/* Hamburger (mobile only) */}
                <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                    <span /><span /><span />
                </button>
            </motion.nav>

            {/* ══ HERO ══ */}
            <section style={{
                position: "relative", minHeight: "100vh",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "100px 20px 70px", overflow: "hidden",
            }}>
                {/* glow */}
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 56% at 50% 38%, rgba(170,0,0,0.17) 0%, transparent 72%)", pointerEvents: "none" }} />

                {/* large decorative drop — hidden on very small screens via opacity trick */}
                <motion.div
                    animate={{ y: [0, -18, 0], rotate: [0, 4, 0] }}
                    transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ position: "absolute", right: "5%", top: "18%", opacity: 0.06, pointerEvents: "none" }}
                >
                    <BloodDrop size={260} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 36 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.85 }}
                    style={{ textAlign: "center", maxWidth: 780, position: "relative", zIndex: 2, width: "100%" }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ scale: 0.82, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 7,
                            background: "rgba(255,43,43,0.1)", border: "1px solid rgba(255,43,43,0.3)",
                            borderRadius: 50, padding: "7px 18px", marginBottom: 26,
                        }}
                    >
                        <span style={{ fontSize: 12 }}>🩸</span>
                        <span className="hero-badge-text" style={{ color: "#ff6b6b", fontSize: 12, fontWeight: 500, letterSpacing: 1 }}>
                            INDIA'S LEADING BLOOD DONATION PLATFORM
                        </span>
                    </motion.div>

                    {/* H1 */}
                    <motion.h1
                        className="hero-h1"
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.78 }}
                        style={{
                            fontWeight: 900, lineHeight: 1.15,
                            margin: "0 0 22px",
                            background: "linear-gradient(135deg, #ffffff 0%, #ff7070 50%, #ff2b2b 100%)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        }}
                    >
                        Every Drop Counts.<br />
                        <span style={{ background: "linear-gradient(135deg,#ff2b2b,#ff7070)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            Be the Real Hero.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        className="hero-sub"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.48, duration: 0.7 }}
                        style={{ color: "rgba(255,255,255,0.58)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.72 }}
                    >
                        Connect with donors, request blood in emergencies, and save lives — all in real time.
                        Join over <strong style={{ color: "#ff4c4c" }}>45,000 heroes</strong> making a difference.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        className="hero-btns"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.6 }}
                        style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
                    >
                        <button className="btn-primary" id="cta-register" onClick={() => navigate("/register")}>
                            🩸 Start Donating
                        </button>
                        <button className="btn-secondary" id="cta-login" onClick={() => navigate("/login")}>
                            Sign In →
                        </button>
                    </motion.div>

                    {/* Trust */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.6 }}
                        style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, marginTop: 28 }}
                    >
                        ✓ Free forever &nbsp;·&nbsp; ✓ No spam &nbsp;·&nbsp; ✓ Verified donors only
                    </motion.p>
                </motion.div>
            </section>

            {/* ══ STATS ══ */}
            <section style={{ padding: "50px 20px 70px", background: "#0e0e0e" }}>
                <div style={{ maxWidth: 1060, margin: "0 auto" }}>
                    <div className="stats-grid">
                        {stats.map((s, i) => (
                            <motion.div
                                key={s.label}
                                className="stat-card"
                                initial={{ opacity: 0, y: 26 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.09, duration: 0.55 }}
                            >
                                <div style={{ fontSize: 34, fontWeight: 800, color: "#ff2b2b", marginBottom: 5 }}>
                                    <Counter target={s.value} suffix={s.suffix} />
                                </div>
                                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500, letterSpacing: 0.4 }}>
                                    {s.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ FEATURES ══ */}
            <section id="features" style={{ padding: "70px 20px", background: "#0a0a0a" }}>
                <div style={{ maxWidth: 1060, margin: "0 auto" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 22 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.65 }}
                        style={{ textAlign: "center", marginBottom: 52 }}
                    >
                        <span style={{ color: "#ff4c4c", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Why Real-Hero</span>
                        <h2 className="section-title" style={{ color: "#fff", fontWeight: 800, margin: "10px 0 14px", lineHeight: 1.2 }}>
                            Platform Built to Save Lives
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 15, maxWidth: 460, margin: "0 auto" }}>
                            Everything you need to connect donors with patients — fast, safe, and intelligent.
                        </p>
                    </motion.div>

                    <div className="features-grid">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                className="feature-card"
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07, duration: 0.55 }}
                            >
                                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
                                <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 9px" }}>{f.title}</h3>
                                <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 14, lineHeight: 1.68, margin: 0 }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ HOW IT WORKS ══ */}
            <section id="how-it-works" style={{ padding: "70px 20px", background: "#0d0d0d" }}>
                <div style={{ maxWidth: 1060, margin: "0 auto" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 22 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.65 }}
                        style={{ textAlign: "center", marginBottom: 52 }}
                    >
                        <span style={{ color: "#ff4c4c", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Simple Process</span>
                        <h2 className="section-title" style={{ color: "#fff", fontWeight: 800, margin: "10px 0 0", lineHeight: 1.2 }}>
                            How It Works
                        </h2>
                    </motion.div>

                    <div className="steps-grid">
                        {steps.map((s, i) => (
                            <motion.div
                                key={s.num}
                                className="step-card"
                                initial={{ opacity: 0, y: 22 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.55 }}
                            >
                                <div style={{
                                    fontSize: 42, fontWeight: 900, lineHeight: 1, marginBottom: 14,
                                    background: "linear-gradient(135deg, rgba(255,43,43,0.35), rgba(255,43,43,0.07))",
                                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                                }}>
                                    {s.num}
                                </div>
                                <h3 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: "0 0 7px" }}>{s.title}</h3>
                                <p style={{ color: "rgba(255,255,255,0.43)", fontSize: 13, margin: 0, lineHeight: 1.65 }}>{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ BLOOD TYPES ══ */}
            <section id="blood-types" style={{ padding: "70px 20px", background: "#090909" }}>
                <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 22 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.65 }}
                    >
                        <span style={{ color: "#ff4c4c", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Compatibility</span>
                        <h2 className="section-title" style={{ color: "#fff", fontWeight: 800, margin: "10px 0 14px" }}>
                            All Blood Types Welcome
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 15, maxWidth: 430, margin: "0 auto 44px" }}>
                            Whether you're O− (universal donor) or AB+ (universal recipient), every blood type saves lives.
                        </p>
                        <div className="blood-grid">
                            {bloodTypes.map((type, i) => (
                                <motion.div
                                    key={type}
                                    className="blood-badge"
                                    initial={{ opacity: 0, scale: 0.65 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.06, duration: 0.38 }}
                                >
                                    {type}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ══ TESTIMONIAL ══ */}
            <section style={{
                padding: "56px 20px",
                background: "rgba(255,43,43,0.04)",
                borderTop: "1px solid rgba(255,43,43,0.08)",
                borderBottom: "1px solid rgba(255,43,43,0.08)",
            }}>
                <div style={{ maxWidth: 660, margin: "0 auto", textAlign: "center" }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div style={{ fontSize: 42, marginBottom: 18, color: "#ff2b2b" }}>❝</div>
                        <p className="testimonial-quote" style={{ color: "rgba(255,255,255,0.72)", fontSize: 18, fontStyle: "italic", lineHeight: 1.75, margin: "0 0 18px" }}>
                            "Real-Hero connected me to a donor within 12 minutes. My daughter's surgery was successful because of this platform. It truly saved her life."
                        </p>
                        <div style={{ color: "#ff4c4c", fontWeight: 600, fontSize: 14 }}>— Priya Sharma, Mumbai</div>
                    </motion.div>
                </div>
            </section>

            {/* ══ CTA ══ */}
            <section style={{ padding: "90px 20px", background: "#090909", position: "relative", overflow: "hidden" }}>
                <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(150,0,0,0.14) 0%, transparent 72%)",
                    pointerEvents: "none",
                }} />
                <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.75 }}
                    >
                        <div style={{ marginBottom: 22 }}><BloodDrop size={50} /></div>
                        <h2 className="cta-h2" style={{ color: "#fff", fontWeight: 900, margin: "0 0 18px", lineHeight: 1.2 }}>
                            Ready to Become a<br />
                            <span style={{ color: "#ff2b2b" }}>Real Hero?</span>
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 16, margin: "0 0 36px", lineHeight: 1.72 }}>
                            Join thousands of donors saving lives every day. Register free and make your first donation count.
                        </p>
                        <div className="cta-btns" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                            <button className="btn-primary" onClick={() => navigate("/register")}>
                                🩸 Create Free Account
                            </button>
                            <button className="btn-secondary" onClick={() => navigate("/login")}>
                                Already a Hero? Login
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ══ FOOTER ══ */}
            <footer style={{
                background: "#050505",
                borderTop: "1px solid rgba(255,43,43,0.1)",
                padding: "36px 20px 24px",
                textAlign: "center",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                    <BloodDrop size={20} />
                    <span style={{ color: "#ff2b2b", fontSize: 17, fontWeight: 800 }}>Real<span style={{ color: "rgba(255,255,255,0.65)" }}>-Hero</span></span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, margin: "0 0 14px" }}>
                    Connecting donors with those in need — one drop at a time.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", marginBottom: 18 }}>
                    <button className="nav-link" style={{ fontSize: 13 }} onClick={() => navigate("/login")}>Login</button>
                    <button className="nav-link" style={{ fontSize: 13 }} onClick={() => navigate("/register")}>Register</button>
                    <button className="nav-link" style={{ fontSize: 13 }} onClick={() => scrollTo("features")}>Features</button>
                    <button className="nav-link" style={{ fontSize: 13 }} onClick={() => scrollTo("how-it-works")}>How It Works</button>
                    <button className="nav-link" style={{ fontSize: 13 }} onClick={() => navigate("/about")}>Meet the Team</button>
                </div>
                <p style={{ color: "rgba(255,255,255,0.14)", fontSize: 12, margin: 0 }}>
                    © 2025 Real-Hero. All rights reserved. Built with ❤️ for humanity.
                </p>
            </footer>

        </div>
    );
}
