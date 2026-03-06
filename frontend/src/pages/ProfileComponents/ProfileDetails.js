import React from "react";
import { Box, Card, CardContent, Divider, Grid, InputAdornment, MenuItem, TextField, Typography, Button } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LockResetIcon from "@mui/icons-material/LockReset";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

import { getInputStyle } from "./styles";

// Extracted from original ProfileForm.js for reuse
export default function ProfileDetails({ t, formData, handleInput, isEditing, calculatedAge, handleResetPassword, userStats }) {
    const inputStyle = getInputStyle(isEditing);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

            {/* 1. Contact Information Card */}
            <Card sx={{ background: "rgba(10,10,10,0.8)", borderRadius: 4, backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", overflow: "visible" }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                        <Box sx={{ width: 8, height: 24, bgcolor: "#ff2d2d", borderRadius: 4 }} />
                        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>Contact Information</Typography>
                    </Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField label={t('fullName')} name="name" value={formData.name} onChange={handleInput} disabled={!isEditing} fullWidth
                                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: isEditing ? "#ff2d2d" : "rgba(255,255,255,0.3)" }} /></InputAdornment>, sx: inputStyle.InputProps.sx }} InputLabelProps={inputStyle.InputLabelProps} sx={inputStyle.sx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label={t('emailAddress')} name="email" value={formData.email} disabled fullWidth
                                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: "rgba(255,255,255,0.3)" }} /></InputAdornment>, sx: inputStyle.InputProps.sx }} InputLabelProps={inputStyle.InputLabelProps} sx={inputStyle.sx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label={t('phone')} name="phone" value={formData.phone} onChange={handleInput} disabled={!isEditing} placeholder="+91 XXXXX XXXXX" fullWidth
                                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: isEditing ? "#ff2d2d" : "rgba(255,255,255,0.3)" }} /></InputAdornment>, sx: inputStyle.InputProps.sx }} InputLabelProps={inputStyle.InputLabelProps} sx={inputStyle.sx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField select label={t('gender')} name="gender" value={formData.gender} onChange={handleInput} disabled={!isEditing} fullWidth
                                SelectProps={{ native: false, MenuProps: { PaperProps: { sx: { background: 'rgba(20,20,20,0.95)', border: "1px solid rgba(255,255,255,0.1)", color: '#fff' } } } }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><WcIcon sx={{ color: isEditing ? "#ff2d2d" : "rgba(255,255,255,0.3)" }} /></InputAdornment>, sx: inputStyle.InputProps.sx }} InputLabelProps={inputStyle.InputLabelProps} sx={inputStyle.sx}>
                                <MenuItem value="" sx={{ color: '#fff' }}>{t('selectGender')}</MenuItem>
                                <MenuItem value="Male" sx={{ color: '#fff' }}>{t('male')}</MenuItem>
                                <MenuItem value="Female" sx={{ color: '#fff' }}>{t('female')}</MenuItem>
                                <MenuItem value="Others" sx={{ color: '#fff' }}>{t('others')}</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 2. Health Information Card */}
            <Card sx={{ background: "rgba(10,10,10,0.8)", borderRadius: 4, backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", overflow: "visible" }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                        <Box sx={{ width: 8, height: 24, bgcolor: "#4caf50", borderRadius: 4 }} />
                        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>Health Information</Typography>
                    </Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField label={t('dateOfBirth')} type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInput} disabled={!isEditing} fullWidth
                                InputLabelProps={{ shrink: true, sx: { color: "rgba(255,255,255,0.6)", '&.Mui-focused': { color: "#ff2d2d" } } }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon sx={{ color: isEditing ? "#ff2d2d" : "rgba(255,255,255,0.3)" }} /></InputAdornment>, sx: inputStyle.InputProps.sx }} sx={inputStyle.sx} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField label={t('age')} value={calculatedAge} disabled fullWidth
                                InputProps={{ sx: inputStyle.InputProps.sx }} InputLabelProps={inputStyle.InputLabelProps} sx={inputStyle.sx} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField select label={t('bloodGroup')} name="bloodGroup" value={formData.bloodGroup} onChange={handleInput} disabled={!isEditing} fullWidth
                                SelectProps={{ native: false, MenuProps: { PaperProps: { sx: { background: 'rgba(20,20,20,0.95)', border: "1px solid rgba(255,255,255,0.1)", color: '#fff' } } } }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><FavoriteIcon sx={{ color: isEditing ? "#ff2d2d" : "rgba(255,255,255,0.3)" }} /></InputAdornment>, sx: inputStyle.InputProps.sx }} InputLabelProps={inputStyle.InputLabelProps} sx={inputStyle.sx}>
                                <MenuItem value="" sx={{ color: '#fff' }}>{t('selectBloodGroupPlaceholder')}</MenuItem>
                                <MenuItem value="A+" sx={{ color: '#fff' }}>A+</MenuItem>
                                <MenuItem value="A-" sx={{ color: '#fff' }}>A-</MenuItem>
                                <MenuItem value="B+" sx={{ color: '#fff' }}>B+</MenuItem>
                                <MenuItem value="B-" sx={{ color: '#fff' }}>B-</MenuItem>
                                <MenuItem value="O+" sx={{ color: '#fff' }}>O+</MenuItem>
                                <MenuItem value="O-" sx={{ color: '#fff' }}>O-</MenuItem>
                                <MenuItem value="AB+" sx={{ color: '#fff' }}>AB+</MenuItem>
                                <MenuItem value="AB-" sx={{ color: '#fff' }}>AB-</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField label={t('weight')} type="number" name="weight" value={formData.weight} onChange={handleInput} disabled={!isEditing} placeholder={t('minWeightMsg')} fullWidth
                                InputProps={{ startAdornment: <InputAdornment position="start"><FitnessCenterIcon sx={{ color: isEditing ? "#ff2d2d" : "rgba(255,255,255,0.3)" }} /></InputAdornment>, sx: inputStyle.InputProps.sx }} InputLabelProps={inputStyle.InputLabelProps} sx={inputStyle.sx} />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 3. Donation Activity Card */}
            <Card sx={{ background: "rgba(10,10,10,0.8)", borderRadius: 4, backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", overflow: "visible" }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                        <Box sx={{ width: 8, height: 24, bgcolor: "#2196f3", borderRadius: 4 }} />
                        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>Donation Metrics</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={4}>
                            <Box sx={{ background: "rgba(255,255,255,0.03)", p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 2, alignItems: "center" }}>
                                <LocalHospitalIcon sx={{ color: "#ff2d2d", fontSize: 28 }} />
                                <Box>
                                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.2rem", lineHeight: 1 }}>
                                        {userStats?.donationsCount || 0}
                                    </Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase" }}>Total Donations</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Box sx={{ background: "rgba(255,255,255,0.03)", p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 2, alignItems: "center" }}>
                                <WorkspacePremiumIcon sx={{ color: "#ff9800", fontSize: 28 }} />
                                <Box>
                                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.2rem", lineHeight: 1 }}>
                                        {userStats?.leaderboardPoints || 0}
                                    </Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase" }}>Reward Points</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ background: "rgba(255,255,255,0.03)", p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.05)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem", mb: 0.5 }}>Community Rank: Master</Typography>
                                <Box sx={{ width: "100%", height: 6, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                                    <Box sx={{ width: "70%", height: "100%", bgcolor: "#2196f3", borderRadius: 2 }} />
                                </Box>
                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", mt: 0.5, textAlign: "right" }}>30 XP to next rank</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 4. Security Settings Card */}
            <Card sx={{ background: "rgba(10,10,10,0.8)", borderRadius: 4, backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", overflow: "visible" }}>
                <CardContent sx={{ p: { xs: 3, md: 4 }, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}>Security Settings</Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Update your password to secure your account.</Typography>
                    </Box>
                    <Button variant="outlined" startIcon={<LockResetIcon />} onClick={handleResetPassword}
                        sx={{ color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.2)", borderRadius: 2, px: 2, py: 1.5, "&:hover": { color: "#ff2d2d", borderColor: "#ff2d2d", bgcolor: "rgba(255,45,45,0.05)" } }}
                    >
                        Reset Password
                    </Button>
                </CardContent>
            </Card>

        </Box>
    );
}
