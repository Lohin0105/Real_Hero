import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Divider,
  useMediaQuery,
  Menu,
  MenuItem,
  Tooltip,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  ListItem,
  ListItemAvatar,
  ListItemText as MuiListItemText,
  FormControlLabel,
  Switch,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MapIcon from "@mui/icons-material/Map";
// removed topbar icons - keep only profile/avatar
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import RefreshIcon from "@mui/icons-material/Refresh";
import PublicIcon from "@mui/icons-material/Public";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";

import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { authUtils } from "../utils/auth";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Request() {
  const { t } = useTranslation();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [active, setActive] = useState("request");
  const isMobile = useMediaQuery("(max-width:900px)");
  const navigate = useNavigate();

  // Profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  const profileOpen = Boolean(anchorEl);

  // Form state
  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    bloodGroup: "",
    units: 1,
    hospital: "",
    description: "",
    urgency: "normal",
  });

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // coords & detection
  const [coords, setCoords] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [attachLocation, setAttachLocation] = useState(true);

  // recent requests
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // fake user fallback (keeps UI intact)
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("userProfile");
      return cached ? JSON.parse(cached) : { name: "Uday", email: "vtu23036@veltech.edu.in" };
    } catch (e) {
      return { name: "Uday", email: "vtu23036@veltech.edu.in" };
    }
  });

  useEffect(() => {
    // try to fetch current user profile (non-blocking)
    async function loadUser() {
      try {
        const res = await fetch(`${API_BASE}/api/user/me`, {
          credentials: "include",
          headers: authUtils.getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem("userProfile", JSON.stringify(data));
          setForm((f) => ({
            ...f,
            name: data.name || f.name,
            phone: data.phone || f.phone
          }));
          return;
        }
      } catch (e) {
        console.warn("Failed to fetch current user:", e);
      }
    }

    (async () => { await loadUser(); })();
    const onAuth = () => loadUser();
    const onUpdated = () => loadUser();
    try { window.addEventListener('auth-changed', onAuth); window.addEventListener('user-updated', onUpdated); } catch (e) { }

    loadRecentRequests();
    const auto = setInterval(loadRecentRequests, 15000);
    return () => { clearInterval(auto); try { window.removeEventListener('auth-changed', onAuth); window.removeEventListener('user-updated', onUpdated); } catch (e) { } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRecentRequests() {
    setLoadingRecent(true);
    try {
      const q = coords ? `?limit=6&lat=${coords.lat}&lng=${coords.lng}` : "?limit=6";
      const res = await fetch(`${API_BASE}/api/requests/recent${q}`, {
        headers: authUtils.getAuthHeaders()
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("GET /api/requests/recent failed", res.status, txt);
        setRecent([]);
        setLoadingRecent(false);
        return;
      }
      const data = await res.json();
      setRecent(data || []);
    } catch (err) {
      console.error("loadRecentRequests error:", err);
      setRecent([]);
    }
    setLoadingRecent(false);
  }

  function handleField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  // Try reverse geocode via Geoapify (same as Donate.js); fallback to coords string
  async function detectLocationAndAutofill() {
    setDetecting(true);
    setSubmitError(null);
    try {
      if (!navigator.geolocation) throw new Error("Geolocation not supported");
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });

      // reverse geocode using Geoapify (same API as Donate.js for consistency)
      try {
        const apiKey = process.env.REACT_APP_GEOAPIFY_API_KEY;
        if (apiKey) {
          const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`;
          const r = await fetch(url);
          if (r.ok) {
            const data = await r.json();
            if (data.features && data.features.length > 0) {
              const props = data.features[0].properties;

              // Construct a more specific address (same logic as Donate.js)
              const parts = [];
              if (props.name) parts.push(props.name);
              if (props.street) parts.push(props.street);
              if (props.suburb && props.suburb !== props.name) parts.push(props.suburb);
              if (props.city && props.city !== props.suburb) parts.push(props.city);

              let address = parts.join(", ");

              // Add postcode/state if available
              const suffix = [];
              if (props.postcode) suffix.push(props.postcode);
              if (props.state_code) suffix.push(props.state_code);
              if (props.country) suffix.push(props.country);

              if (suffix.length > 0) {
                address += (address ? " - " : "") + suffix.join(", ");
              }

              // Fallback to formatted if empty
              if (!address || address.length < 5) {
                address = props.formatted || `${props.address_line1}, ${props.address_line2}`;
              }

              setForm((s) => ({ ...s, hospital: address }));
            } else {
              setForm((s) => ({ ...s, hospital: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
            }
          } else {
            setForm((s) => ({ ...s, hospital: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
          }
        } else {
          // Fallback to coordinates if no API key
          setForm((s) => ({ ...s, hospital: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
        }
      } catch (e) {
        console.warn("Reverse geocode failed:", e);
        setForm((s) => ({ ...s, hospital: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
      }
    } catch (err) {
      console.error("detectLocation error:", err);
      setSubmitError("Could not detect location: " + (err?.message || "unknown"));
    }
    setDetecting(false);
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    // basic validation
    if (!form.name || !form.phone || !form.bloodGroup || !form.hospital) {
      setSubmitError("Please fill required fields: name, phone, blood group, hospital");
      setSubmitting(false);
      return;
    }

    try {
      // Ensure we have coords available before building payload. Use a local finalCoords var
      let finalCoords = coords;

      if (attachLocation && (!finalCoords || typeof finalCoords.lat !== 'number' || typeof finalCoords.lng !== 'number')) {
        // try to get a live geolocation reading first
        try {
          if (navigator.geolocation) {
            const pos = await new Promise((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
            );
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            finalCoords = { lat, lng };
            setCoords(finalCoords);

            // If hospital empty, fill it from reverse geocode
            if (!form.hospital) {
              try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
                const r = await fetch(url, { headers: { "User-Agent": "Real-Hero-App" } });
                if (r.ok) {
                  const j = await r.json();
                  // Construct a more specific address
                  const addr = j.address || {};
                  const parts = [
                    addr.road || addr.pedestrian || addr.street,
                    addr.suburb || addr.neighbourhood || addr.residential,
                    addr.city || addr.town || addr.village || addr.county
                  ].filter(Boolean);

                  const display = parts.length > 0 ? parts.join(", ") : (j.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                  setForm((s) => ({ ...s, hospital: display }));
                } else {
                  setForm((s) => ({ ...s, hospital: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
                }
              } catch (e) {
                // ignore reverse geocode error
              }
            }
          }
        } catch (errGeo) {
          // geolocation failed — attempt best-effort geocode from hospital text
          if (attachLocation && form.hospital) {
            try {
              const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(form.hospital)}&limit=1`;
              const r2 = await fetch(searchUrl, { method: 'GET' });
              if (r2.ok) {
                const hits = await r2.json();
                if (Array.isArray(hits) && hits.length > 0) {
                  const first = hits[0];
                  const latN = parseFloat(first.lat);
                  const lonN = parseFloat(first.lon);
                  if (!Number.isNaN(latN) && !Number.isNaN(lonN)) {
                    finalCoords = { lat: latN, lng: lonN };
                    setCoords(finalCoords);
                  }
                }
              }
            } catch (e2) {
              // ignore geocode failures
            }
          }
          console.warn('Geolocation attempt before submit failed:', errGeo);
        }
      }

      const payload = {
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        units: Number(form.units || 1),
        hospital: form.hospital,
        description: form.description,
        urgency: form.urgency || "normal",
      };

      if (attachLocation && finalCoords && typeof finalCoords.lat === "number" && typeof finalCoords.lng === "number") {
        payload.location = { lat: finalCoords.lat, lng: finalCoords.lng };
        payload.locationGeo = { type: "Point", coordinates: [finalCoords.lng, finalCoords.lat] };
      }

      const res = await fetch(`${API_BASE}/api/requests/create`, {
        method: "POST",
        credentials: "include",
        headers: authUtils.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `Server returned ${res.status}`;
        try {
          const j = await res.json();
          msg = j.message || j.error || JSON.stringify(j);
        } catch (e) {
          const t = await res.text();
          msg = t || msg;
        }
        console.error("POST /api/requests/create failed:", msg);
        setSubmitError("Failed to submit request: " + msg);
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      // success: clear main fields (but keep name/phone)
      setForm((s) => ({
        ...s,
        age: "",
        phone: user?.phone || "",
        bloodGroup: "",
        units: 1,
        hospital: "",
        description: "",
        urgency: "normal",
      }));
      setCoords(null);
      // refresh recent
      // refresh recent
      await loadRecentRequests();

      Swal.fire({
        title: 'Request Sent!',
        text: 'We have notified nearby donors. You will be notified when someone accepts.',
        icon: 'success',
        confirmButtonColor: '#d33',
      });
    } catch (err) {
      console.error("handleSubmit error:", err);
      setSubmitError("Failed to submit request: " + (err?.message || "network error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0b0b0b 0%,#151515 100%)",
        color: "#fff",
        pb: 6,
        overflowX: "hidden",
        maxWidth: "100vw",
      }}
    >
      {/* TOP NAV */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2, md: 6 }, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpenSidebar(true)}>
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h4"
            sx={{
              color: "#ff2b2b",
              fontWeight: 800,
              textShadow: "0 0 18px rgba(255,20,20,0.85)",
              display: "block",
            }}
          >
            Real-Hero
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* only profile avatar visible */}

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)" }}>{!user?.profilePhoto && (user?.name || "U").charAt(0).toUpperCase()}</Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
              <Typography variant="caption" sx={{ color: "#777" }}>
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
              {t('profile')}
            </MenuItem>
            <MenuItem
              onClick={() => {
                authUtils.logout();
                window.location.href = "/";
              }}
            >
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> {t('logout')}
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* BODY */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4, px: { xs: 2, md: 6 } }}>
        {!isMobile && (
          <Box sx={{ width: 260, mt: 2 }}>
            <Box sx={{ position: "sticky", top: 24 }}><Sidebar /></Box>
          </Box>
        )}

        {isMobile && <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)}><Sidebar onClose={() => setOpenSidebar(false)} /></Drawer>}

        <Box sx={{ flex: 1, pt: 3, minWidth: 0 }}>
          <Card sx={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", p: 3 }}>
            <Typography variant="h5" sx={{ color: "#ff2b2b", fontWeight: 800, mb: 2 }}>
              {t('requestBloodTitle')}
            </Typography>

            {submitError && (
              <Box sx={{ background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,0,0,0.12)", p: 2, borderRadius: 1, mb: 2 }}>
                <Typography sx={{ color: "#ff8a8a" }}>{submitError}</Typography>
              </Box>
            )}

            {/* Custom Input Styles equivalent to .auth-input */}
            <style>{`
              .glass-input {
                width: 100%;
                background: rgba(255,255,255,0.04);
                border: 1.5px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 14px 16px;
                color: #fff;
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                outline: none;
                transition: border-color 0.25s, background 0.25s;
              }
              .glass-input::placeholder { color: rgba(255,255,255,0.28); }
              .glass-input:focus {
                border-color: rgba(255,43,43,0.6);
                background: rgba(255,255,255,0.07);
              }
              
              .glass-label {
                color: rgba(255,255,255,0.52);
                font-size: 12px;
                font-weight: 500;
                display: block;
                margin-bottom: 6px;
                letter-spacing: 0.4px;
              }
            `}</style>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <label className="glass-label">Blood Group *</label>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
                    {BLOOD_GROUPS.map(bg => (
                      <Box
                        key={bg}
                        onClick={() => handleField("bloodGroup", bg)}
                        sx={{
                          cursor: 'pointer',
                          px: 2.5,
                          py: 1,
                          borderRadius: '12px',
                          border: '1.5px solid',
                          borderColor: form.bloodGroup === bg ? '#ff2b2b' : 'rgba(255,255,255,0.08)',
                          background: form.bloodGroup === bg ? 'rgba(255,43,43,0.15)' : 'rgba(255,255,255,0.04)',
                          color: form.bloodGroup === bg ? '#fff' : 'rgba(255,255,255,0.6)',
                          fontWeight: form.bloodGroup === bg ? 700 : 500,
                          transition: 'all 0.2s',
                          '&:hover': {
                            background: form.bloodGroup === bg ? 'rgba(255,43,43,0.2)' : 'rgba(255,255,255,0.08)'
                          }
                        }}
                      >
                        {bg}
                      </Box>
                    ))}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <label className="glass-label">Patient Name *</label>
                  <input
                    className="glass-input"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(e) => handleField("name", e.target.value)}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <label className="glass-label">Age</label>
                  <input
                    className="glass-input"
                    type="number"
                    placeholder="e.g. 34"
                    value={form.age}
                    onChange={(e) => handleField("age", e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <label className="glass-label">Units Required</label>
                  <input
                    className="glass-input"
                    type="number"
                    placeholder="1"
                    min="1"
                    value={form.units}
                    onChange={(e) => handleField("units", e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <label className="glass-label">Contact Phone *</label>
                  <input
                    className="glass-input"
                    type="tel"
                    placeholder="10-digit mobile"
                    value={form.phone}
                    onChange={(e) => handleField("phone", e.target.value)}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="glass-label" style={{ marginBottom: 0 }}>Urgency Level</label>
                  </Box>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    mt: 0.5,
                    p: 1, pl: 2,
                    border: '1.5px solid',
                    borderColor: form.urgency === 'critical' ? 'rgba(255,43,43,0.5)' : 'rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    background: form.urgency === 'critical' ? 'rgba(255,43,43,0.05)' : 'rgba(255,255,255,0.04)',
                    transition: 'all 0.3s'
                  }}>
                    <Typography sx={{
                      color: form.urgency === 'critical' ? '#ff4444' : 'rgba(255,255,255,0.7)',
                      fontWeight: form.urgency === 'critical' ? 600 : 400,
                      fontSize: 14
                    }}>
                      {form.urgency === 'critical' ? 'CRITICAL - Need Immediately' : 'Normal Request'}
                    </Typography>
                    <Switch
                      checked={form.urgency === 'critical'}
                      onChange={(e) => handleField("urgency", e.target.checked ? 'critical' : 'normal')}
                      color="error"
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <label className="glass-label">Hospital Name & Location (Optional) *</label>
                  <input
                    className="glass-input"
                    placeholder="Search or detect hospital..."
                    value={form.hospital}
                    onChange={(e) => handleField("hospital", e.target.value)}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <label className="glass-label">Reason / Description (Optional)</label>
                  <textarea
                    className="glass-input"
                    placeholder="Any specific medical requirements or notes for the donor..."
                    value={form.description}
                    onChange={(e) => handleField("description", e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting}
                    sx={{
                      px: 4,
                      minHeight: 48,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #ff2b2b, #b60000)',
                      fontWeight: 700,
                      boxShadow: '0 8px 20px rgba(255,43,43,0.3)',
                      marginRight: 1
                    }}
                  >
                    {submitting ? t('loading') : "Create Request"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => setForm({ name: user?.name || "", age: "", phone: user?.phone || "", bloodGroup: "", units: 1, hospital: "", description: "", urgency: "normal" })}
                    sx={{ minHeight: 48, borderRadius: '12px', borderColor: 'rgba(255,255,255,0.2)', color: '#ccc' }}
                  >
                    {t('clearAll')}
                  </Button>

                  <Box sx={{ ml: { xs: 0, md: "auto" }, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", width: { xs: '100%', md: 'auto' } }}>
                    <Button
                      variant="outlined"
                      onClick={detectLocationAndAutofill}
                      disabled={detecting}
                      startIcon={<GpsFixedIcon />}
                      sx={{
                        minHeight: 48,
                        flex: { xs: 1, sm: 'initial' },
                        borderRadius: '12px',
                        borderColor: 'rgba(255,255,255,0.15)',
                        color: '#ddd'
                      }}
                    >
                      {detecting ? t('loading') : t('detectMyLocation')}
                    </Button>
                    {coords && (
                      <Typography variant="caption" sx={{ color: "#999", display: { xs: 'none', sm: 'block' } }}>
                        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Card>
        </Box>

        {/* RIGHT PANEL: Recent Requests */}
        <Box sx={{ width: { xs: "100%", md: 360 }, mt: 2 }}>
          <Card sx={{ background: "rgba(255,255,255,0.02)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ fontWeight: 700, color: "#ff2b2b" }}>{t('activeRequests')}</Typography>
              <IconButton size="small" onClick={() => loadRecentRequests()}>
                <RefreshIcon sx={{ color: "#ddd" }} />
              </IconButton>
            </Box>

            {loadingRecent ? (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CircularProgress color="error" />
              </Box>
            ) : recent.length === 0 ? (
              <Typography sx={{ color: "#bbb" }}>{t('noRecentActivity')}</Typography>
            ) : (
              <Box>
                {recent.map((r) => (
                  <ListItem key={r._id} sx={{ background: "rgba(255,255,255,0.02)", mb: 1, borderRadius: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{
                        bgcolor: r.urgency === 'critical' ? "#ff0000" : "rgba(255,43,43,0.15)",
                        color: r.urgency === 'critical' ? "#fff" : "#ff2b2b",
                        boxShadow: r.urgency === 'critical' ? "0 0 10px rgba(255,0,0,0.5)" : "none"
                      }}>
                        <LocalHospitalIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <MuiListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography>
                          <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', px: 1, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700 }}>
                            {r.bloodGroup || "Unknown"}
                          </Box>
                          {r.urgency === 'critical' && (
                            <Typography sx={{ color: '#ff4444', fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>CRITICAL</Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" sx={{ color: "#aaa", display: "block", mt: 0.5 }}>
                            {r.hospital ? r.hospital : "Location pending"}
                            {r.distanceKm && ` • ${r.distanceKm} km`}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{r.description}</Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </Box>
            )}
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

