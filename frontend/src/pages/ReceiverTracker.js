import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { authUtils } from "../utils/auth";
import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteIcon from "@mui/icons-material/Favorite";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import "leaflet/dist/leaflet.css";

// --- Creating Leaflet Sliding Animation Plugin ---
// A tiny custom marker to handle smooth CSS transitions in leaflet
const SMOOTH_MARKER = L.Marker.extend({
  setLatLng: function (latlng) {
    const oldLatLng = this.getLatLng();
    L.Marker.prototype.setLatLng.call(this, latlng);
    if (this._icon && oldLatLng) {
      if (!this._icon.style.transition) {
        this._icon.style.transition = 'transform 3s linear';
      }
    }
    return this;
  }
});

const BIKE_ICON = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const HOSPITAL_ICON = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3004/3004458.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

function SmoothBikeMarker({ position }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!position) return;
    if (!markerRef.current) {
      markerRef.current = new SMOOTH_MARKER(position, { icon: BIKE_ICON }).addTo(map);
    } else {
      markerRef.current.setLatLng(position);
    }
  }, [position, map]);

  return null;
}

export default function ReceiverTracker() {
  const { id: requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [donorPos, setDonorPos] = useState(null);
  const [routeLine, setRouteLine] = useState([]);
  const [osrmRoute, setOsrmRoute] = useState([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);

  const API_BASE = useMemo(() => {
    let base = process.env.REACT_APP_API_BASE || "http://localhost:5000";
    try {
      if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(base)) {
          base = base.replace(/localhost|127\.0\.0\.1/, host);
        }
      }
    } catch (e) {}
    return base;
  }, []);

  // Fetch Request Info
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/requests/my-requests`, {
          headers: { Authorization: `Bearer ${authUtils.getToken()}` }
        });
        if (res.ok) {
          const reqs = await res.json();
          const target = reqs.find((r) => String(r._id) === String(requestId));
          if (target) {
            setRequest(target);
          } else {
            alert("Request not found.");
            navigate("/my-requests");
          }
        }
      } catch(e) {
        console.error("Failed to fetch request", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId, navigate, API_BASE]);

  const reqLat = request?.location?.lat ?? request?.locationGeo?.coordinates?.[1];
  const reqLng = request?.location?.lng ?? request?.locationGeo?.coordinates?.[0];
  const destPos = (reqLat && reqLng) ? [reqLat, reqLng] : [20, 78];

  // Connect to Sockets
  useEffect(() => {
    if (!requestId) return;

    socketRef.current = io(API_BASE, { transports: ["websocket", "polling"] });
    socketRef.current.emit("join_tracking_room", `tracking_${requestId}`);

    socketRef.current.on("location_update", (data) => {
      const newPos = [data.lat, data.lng];
      setDonorPos(newPos);
      setRouteLine((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          // If the GPS 'jumps' more than ~11 kilometers (0.1 degrees), it's an IP-to-GPS jump. Reset the trail.
          const dist = Math.sqrt(Math.pow(last[0] - newPos[0], 2) + Math.pow(last[1] - newPos[1], 2));
          if (dist > 0.1) return [newPos];
        }
        return [...prev, newPos];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [requestId, API_BASE]);

  // Fetch OSRM Snapped Road Route
  useEffect(() => {
    if (donorPos && destPos && osrmRoute.length === 0) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${donorPos[1]},${donorPos[0]};${destPos[1]},${destPos[0]}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            // geojson coords are [lng, lat], leaflet plots [lat, lng]
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setOsrmRoute(coords);
          }
        } catch(e) {}
      };
      fetchRoute();
    }
  }, [donorPos, destPos, osrmRoute.length]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0b0b" }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100vw", height: "100vh", position: "relative", background: "#0b0b0b", fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Header Overlay */}
      <Box sx={{ 
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "linear-gradient(180deg, rgba(11,11,11,0.95) 0%, rgba(11,11,11,0.6) 80%, transparent 100%)",
        p: 2, display: "flex", gap: 2, alignItems: "center"
      }}>
        <IconButton sx={{ background: "rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(4px)" }} onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography sx={{ color: "#ff2b2b", fontWeight: 800, fontSize: "1.2rem" }}>Tracking Donor</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>Live GPS Location</Typography>
        </Box>
      </Box>

      {/* Control Panel Overlay (Zomato Style Info) */}
      <Box sx={{
        position: "absolute", bottom: 20, left: 20, right: 20, zIndex: 1000,
        background: "rgba(20,20,20,0.85)", backdropFilter: "blur(12px)",
        borderRadius: 4, p: 2, border: "1px solid rgba(43,255,100,0.3)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
            {donorPos ? <TwoWheelerIcon sx={{ color: "#fff" }} /> : <CircularProgress size={24} color="inherit" />}
          </Box>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
              {donorPos ? "Donor is on the way 🔥" : "Waiting for GPS..."}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>{request?.hospital || "Hospital Destination"}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Map Content */}
      <MapContainer 
        bounds={donorPos ? L.latLngBounds([donorPos, destPos]) : null}
        center={donorPos || destPos} 
        zoom={14} 
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        />

        {/* Highlighted OSRM Route via Roads - Google Maps Style */}
        {osrmRoute.length > 0 && (
          <>
            <Polyline positions={osrmRoute} color="#0f53ff" weight={10} opacity={0.5} />
            <Polyline positions={osrmRoute} color="#3c82fa" weight={6} opacity={1} />
          </>
        )}

        {/* Trail Line (Real time visited nodes) */}
        {routeLine.length > 1 && (
          <Polyline positions={routeLine} color="#2196f3" weight={5} opacity={0.8} />
        )}

        {/* Custom smooth animation marker for donor */}
        <SmoothBikeMarker position={donorPos} />

        {/* Destination Marker */}
        {destPos && (
          <Marker position={destPos} icon={HOSPITAL_ICON}>
            <Popup>{request?.hospital || "Hospital"}</Popup>
          </Marker>
        )}
      </MapContainer>
    </Box>
  );
}
