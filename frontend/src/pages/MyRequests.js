import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "../utils/auth";
import { motion, AnimatePresence } from "framer-motion";

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = authUtils.getToken();
        if (!token) {
          navigate("/login");
          return;
        }
        let apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
        if (typeof window !== "undefined") {
            const host = window.location.hostname;
            if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(apiBase)) {
                apiBase = apiBase.replace(/localhost|127\.0\.0\.1/, host);
            }
        }
        const res = await fetch(`${apiBase}/api/requests/my-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setRequests(data);
        }
      } catch (err) {
        console.error("Failed to fetch requests", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [navigate]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return { label: 'Open', color: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' };
      case 'primary_assigned':
      case 'backup_assigned':
        return { label: 'Assigned', color: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' };
      case 'fulfilled':
        return { label: 'Fulfilled', color: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' };
      case 'cancelled':
      case 'failed':
        return { label: 'Cancelled', color: 'rgba(239, 68, 68, 0.2)', text: '#f87171' };
      default:
        return { label: status, color: 'rgba(255, 255, 255, 0.1)', text: '#fff' };
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const slideUp = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#090909",
      fontFamily: "'Poppins', sans-serif",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        
        .req-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(12px);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
        }
        .req-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,43,43,0.2);
          background: rgba(255,255,255,0.05);
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: color 0.2s;
          margin-bottom: 24px;
          background: transparent;
          border: none;
          padding: 0;
        }
        .back-btn:hover { color: #ff2b2b; }
      `}</style>

      {/* Decorative Glow Elements */}
      <div style={{
        position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%",
        background: "radial-gradient(circle, rgba(255,43,43,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            My Requests <span style={{ color: "#ff2b2b" }}>History</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: "0 0 40px" }}>
            Track the status of your past and ongoing blood donation requests.
          </p>
        </motion.div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: 40, height: 40, border: "3px solid rgba(255,43,43,0.3)", borderTopColor: "#ff2b2b", borderRadius: "50%" }}
            />
          </div>
        ) : requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.1)" }}
          >
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🩸</div>
            <h3 style={{ color: "#fff", fontSize: 20, margin: "0 0 8px" }}>No requests found</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>You haven't made any blood requests yet.</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "grid", gap: 20 }}>
            <AnimatePresence>
              {requests.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <motion.div key={req._id} variants={slideUp} layout>
                    <div className="req-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                        
                        {/* Left Side */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <div style={{
                              background: "rgba(255,43,43,0.1)", color: "#ff2b2b",
                              padding: "6px 12px", borderRadius: 8, fontWeight: 800, fontSize: 18,
                              border: "1px solid rgba(255,43,43,0.2)"
                            }}>
                              {req.bloodGroup}
                            </div>
                            <span style={{
                              background: badge.color, color: badge.text,
                              padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                              letterSpacing: "0.5px", textTransform: "uppercase"
                            }}>
                              {badge.label}
                            </span>
                          </div>
                          
                          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>
                            {req.hospital}
                          </h3>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
                            Patient: {req.name} • {req.units} Unit(s)
                          </p>
                        </div>

                        {/* Right Side */}
                        <div style={{ textAlign: "right" }}>
                          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 8px" }}>
                            {formatDate(req.createdAt)}
                          </p>
                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                            Urgency: <span style={{ 
                              color: req.urgency === 'high' || req.urgency === 'critical' ? '#ef4444' : '#fbbf24',
                              fontWeight: 600, textTransform: 'capitalize' 
                            }}>{req.urgency}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
