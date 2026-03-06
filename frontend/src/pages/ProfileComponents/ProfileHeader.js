import React, { useRef } from "react";
import { Box, Typography, Button, Avatar, Chip, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

export default function ProfileHeader({ formData, isEditing, setIsEditing, handlePhotoUpload, t }) {
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const initials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

    return (
        <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 3,
            background: "linear-gradient(135deg, rgba(15,15,15,0.8) 0%, rgba(5,5,5,1) 100%)",
            borderRadius: 4, p: { xs: 3, md: 4 }, mb: 4,
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
            position: "relative", overflow: "hidden"
        }}>
            {/* Background Glow */}
            <Box sx={{ position: "absolute", top: -50, left: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,45,45,0.1) 0%, transparent 70%)", zIndex: 0 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 3, zIndex: 1 }}>
                {/* Avatar Section */}
                <Box sx={{ position: "relative" }}>
                    <Box sx={{ position: "relative", padding: "4px", borderRadius: "50%", background: "linear-gradient(135deg, #ff2d2d, #ff7b7b)", boxShadow: "0 0 25px rgba(255,45,45,0.3)" }}>
                        <Avatar src={formData.profilePhoto} sx={{ width: 90, height: 90, bgcolor: "#111", fontSize: "2.5rem", fontWeight: 700, border: "3px solid #111" }}>
                            {!formData.profilePhoto && initials(formData.name)}
                        </Avatar>
                    </Box>
                    {isEditing && (
                        <Box sx={{ position: "absolute", bottom: -5, right: -15, display: "flex", gap: 0.5 }}>
                            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhotoUpload} />
                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                            <IconButton size="small" onClick={() => fileInputRef.current.click()} sx={{ bgcolor: "rgba(30,30,30,0.9)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", p: 0.5, "&:hover": { bgcolor: "#444" } }}>
                                <PhotoLibraryIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => cameraInputRef.current.click()} sx={{ bgcolor: "#ff2d2d", color: "#fff", boxShadow: "0 0 10px rgba(255,45,45,0.5)", p: 0.5, "&:hover": { bgcolor: "#e60000" } }}>
                                <CameraAltIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff", letterSpacing: -0.5, mb: 0.5 }}>
                        {formData.name || "User Name"}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", mb: 1.5, fontWeight: 500 }}>
                        {formData.email || "No Email Provided"}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                        <Chip icon={<FavoriteIcon sx={{ color: "#ff2d2d !important", fontSize: 16 }} />} label={`${formData.bloodGroup || "Unknown"} Donor`} size="small" sx={{ bgcolor: "rgba(255,45,45,0.1)", color: "#ff2d2d", fontWeight: 700, border: "1px solid rgba(255,45,45,0.25)", borderRadius: 1.5 }} />
                        <Chip label={formData.available ? "Active Donor" : "Unavailable"} size="small" sx={{ bgcolor: formData.available ? "rgba(76,175,80,0.1)" : "rgba(158,158,158,0.1)", color: formData.available ? "#4caf50" : "#9e9e9e", fontWeight: 700, border: `1px solid ${formData.available ? "rgba(76,175,80,0.25)" : "rgba(158,158,158,0.2)"}`, borderRadius: 1.5 }} />
                    </Box>
                </Box>
            </Box>

            <Box sx={{ zIndex: 1 }}>
                {!isEditing && (
                    <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}
                        sx={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 2, px: 3, py: 1, textTransform: "none", fontWeight: 600, transition: "0.3s", "&:hover": { background: "rgba(255,255,255,0.1)", transform: "translateY(-2px)" } }}
                    >
                        Edit Profile
                    </Button>
                )}
            </Box>
        </Box>
    );
}
