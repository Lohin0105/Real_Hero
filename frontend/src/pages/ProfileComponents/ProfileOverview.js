import React from "react";
import { Box, Typography } from "@mui/material";

export default function ProfileOverview({ formData, rewardLogs = [] }) {
    // Determine badges based on data
    const hasRareBlood = ["O-", "AB-", "A-", "B-"].includes(formData.bloodGroup);

    return (
        <Box sx={{
            background: "rgba(10,10,10,0.8)", borderRadius: 4, p: 4,
            border: "1px solid rgba(255,45,45,0.1)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)", mb: 4
        }}>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>Credibility</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 4 }}>
                <Box sx={{ px: 2, py: 0.8, borderRadius: 2, background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", display: "flex", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: "12px" }}>🟢</span>
                    <Typography sx={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>Verified Donor</Typography>
                </Box>
                {hasRareBlood && (
                    <Box sx={{ px: 2, py: 0.8, borderRadius: 2, background: "rgba(255,45,45,0.08)", border: "1px solid rgba(255,45,45,0.2)", display: "flex", alignItems: "center", gap: 1 }}>
                        <span style={{ fontSize: "12px" }}>🔴</span>
                        <Typography sx={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>Rare Blood Type</Typography>
                    </Box>
                )}
                {formData.badges && formData.badges.map((b, i) => (
                    <Box key={i} sx={{ px: 2, py: 0.8, borderRadius: 2, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", display: "flex", alignItems: "center", gap: 1 }}>
                        <span style={{ fontSize: "12px" }}>🏆</span>
                        <Typography sx={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>{b}</Typography>
                    </Box>
                ))}
            </Box>

            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>Bio</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.6, mb: 4 }}>
                {formData.bio || "No bio provided. This is where you can write a little bit about yourself and why you donate."}
            </Typography>

            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>Recent Activity</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
                <Box sx={{ position: "absolute", left: 7, top: 10, bottom: 10, width: 2, background: "rgba(255,45,45,0.15)", borderRadius: 2 }} />

                {rewardLogs.length === 0 ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", pl: 4 }}>No recent activity found.</Typography>
                ) : (
                    rewardLogs.slice(0, 3).map((log, idx) => (
                        <Box key={idx} sx={{ position: "relative", pl: 4 }}>
                            <Box sx={{ position: "absolute", left: 0, top: 2, width: 14, height: 14, borderRadius: "50%", background: "#ff2d2d", boxShadow: "0 0 10px rgba(255,45,45,0.4)" }} />
                            <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem", mb: 0.2 }}>
                                {log.type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Donation"}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                                {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                {log.hospital ? ` — ${log.hospital}` : ""}
                            </Typography>
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
}
