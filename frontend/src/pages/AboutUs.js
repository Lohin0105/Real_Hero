import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function BloodDrop({ size = 40, color = "#ff2b2b" }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none">
      <path d="M20 2 C20 2 4 22 4 34 C4 43.9 11.2 50 20 50 C28.8 50 36 43.9 36 34 C36 22 20 2 20 2Z" fill={color} />
    </svg>
  );
}

export default function AboutUs() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const teamMembers = [
    {
      name: "Dr. M. Arun",
      role: "Project Guide",
      degrees: "M.E., Ph.D.",
      desc: "Professor / CSE at Vel Tech Rangarajan Dr. Sagunthala R&D Institute of Science and Technology.",
      image: "https://res.cloudinary.com/dk1kmlvla/image/upload/v1776319187/Arun_Sir_mnmyk7.jpg"
    },
    {
      name: "V. Lohin Reddy",
      role: "Lead Developer",
      degrees: "B.Tech",
      desc: "Architected the technical foundation, backend integration, and the seamless user experience of Real-Hero.",
      image: "https://res.cloudinary.com/dk1kmlvla/image/upload/v1776319065/Gemini_Generated_Image_cey0s4cey0s4cey0_r1hyjm.png"
    },
    {
      name: "G. Veera Saradhi",
      role: "Developer",
      degrees: "B.Tech",
      desc: "Contributed to front-end components, user interface implementation, and platform testing.",
      image: "https://res.cloudinary.com/dk1kmlvla/image/upload/v1776325632/saradhi_qw0gva.jpg" // Placeholder
    }
  ];

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const fadeUp = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#090909",
      fontFamily: "'Poppins', sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        
        .team-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 30px;
          text-align: center;
          backdrop-filter: blur(12px);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .team-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 24px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,43,43,0.3);
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,43,43,0.4);
        }

        .img-container {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          margin-bottom: 20px;
          border: 3px solid rgba(255,43,43,0.2);
          padding: 4px;
          background: #111;
          transition: border-color 0.3s ease;
          overflow: hidden;
        }
        .team-card:hover .img-container {
          border-color: #ff2b2b;
        }
        
        .img-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          background: #222;
        }

        .back-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          padding: 20px 30px;
          display: flex;
          align-items: center;
          background: rgba(9,9,9,0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255,43,43,0.1);
          z-index: 100;
        }
      `}</style>

      {/* Decorative Glow Elements */}
      <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: "80%", height: "50%", background: "radial-gradient(circle, rgba(255,43,43,0.1) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Back Navigation Header */}
      <div className="back-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate(-1)}>
          <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 20, marginRight: 10 }}>←</button>
          <BloodDrop size={24} />
          <span style={{ color: "#ff2b2b", fontSize: 20, fontWeight: 800 }}>Real<span style={{ color: "#fff" }}>-Hero</span></span>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "130px auto 100px", padding: "0 20px", position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ textAlign: "center", marginBottom: 70 }}>
          <span style={{ color: "#ff4c4c", fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" }}>Meet The Visionaries</span>
          <h1 style={{ color: "#fff", fontSize: 48, fontWeight: 900, margin: "10px 0 16px", lineHeight: 1.1 }}>
            The Humans behind <span style={{ background: "linear-gradient(135deg, #ff2b2b, #ff7070)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Real-Hero</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, maxWidth: 600, margin: "0 auto", lineHeight: 1.8 }}>
            Our mission is to seamlessly bridge the gap between blood donors and recipients using state-of-the-art technology.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30 }}>
          {teamMembers.map((member, index) => (
            <motion.div key={member.name} variants={fadeUp}>
              <div className="team-card">

                <div className="img-container">
                  <img src={member.image} alt={member.name} className="img-inner" />
                </div>

                <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
                  {member.name}
                </h3>

                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>
                  {member.degrees}
                </div>

                <div style={{
                  background: "rgba(255,43,43,0.1)", color: "#ff4c4c",
                  padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 16,
                  display: "inline-block"
                }}>
                  {member.role}
                </div>

                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: 0, flex: 1 }}>
                  {member.desc}
                </p>

              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} style={{ textAlign: "center", marginTop: 70 }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 14, letterSpacing: 1 }}>Built with passion and a commitment to saving lives.</p>
        </motion.div>
      </div>

    </div>
  );
}
