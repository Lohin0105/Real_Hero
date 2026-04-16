import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { authUtils } from "../utils/auth";
import { Box, Typography, Button, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import "leaflet/dist/leaflet.css";

const BIKE_ICON = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png", // free bike icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const HOSPITAL_ICON = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3004/3004458.png", // free hospital icon
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { animate: true });
  }, [center, map]);
  return null;
}

export default function DonorTracker() {
  const { id: requestId } = useParams();
  const locationState = useLocation().state;
  const navigate = useNavigate();

  const [request, setRequest] = useState(locationState?.request || null);
  const [donorPos, setDonorPos] = useState(null);
  const [routeLine, setRouteLine] = useState([]);
  const [osrmRoute, setOsrmRoute] = useState([]);
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

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

  // 1. Fetch Request if not in state & Claim it formally
  useEffect(() => {
    const claimAndFetch = async () => {
      try {
        if (!request) {
            // Ideally we'd fetch the request from a direct endpoint, but since getRecentRequests returns all,
            // we assume the state has it. If not, rollback.
            alert("Mission data lost. Redirecting to dashboard.");
            navigate("/donations");
            return;
        }

        // Formally claim this request to become `primary_assigned`
        await fetch(`${API_BASE}/api/requests/claim/${requestId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authUtils.getAuthHeaders() }
        });
      } catch(e) {
        console.error("Claiming failed", e);
      }
    };
    claimAndFetch();
  }, [requestId, request, navigate, API_BASE]);

  // 2. Setup WebSockets
  useEffect(() => {
    socketRef.current = io(API_BASE, { transports: ["websocket", "polling"] });
    socketRef.current.emit("join_tracking_room", `tracking_${requestId}`);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [API_BASE, requestId]);

  // 3. Start Geolocation Watcher
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setDonorPos(p);
        setRouteLine(prev => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            // If the GPS 'jumps' more than ~11 kilometers (0.1 degrees), it's an IP-to-GPS jump. Reset the trail.
            const dist = Math.sqrt(Math.pow(last[0] - p[0], 2) + Math.pow(last[1] - p[1], 2));
            if (dist > 0.1) return [p];
          }
          return [...prev, p];
        });

        // Transmit over WebSockets
        if (socketRef.current) {
          socketRef.current.emit("donor_location_update", {
            requestId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: Date.now()
          });
        }
      },
      (err) => {
        console.warn("GPS tracking error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000 // 5 seconds throttle
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestId]);

  const reqLat = request?.location?.lat ?? request?.locationGeo?.coordinates?.[1];
  const reqLng = request?.location?.lng ?? request?.locationGeo?.coordinates?.[0];
  const destPos = (reqLat && reqLng) ? [reqLat, reqLng] : null;

  // 4. Fetch OSRM Road Route
  useEffect(() => {
    if (donorPos && destPos && osrmRoute.length === 0) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${donorPos[1]},${donorPos[0]};${destPos[1]},${destPos[0]}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            // geojson coordinates are [lng, lat], leaflet needs [lat, lng]
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setOsrmRoute(coords);
          }
        } catch(e) {
          console.warn("Failed to fetch OSRM route", e);
        }
      };
      fetchRoute();
    }
  }, [donorPos, destPos, osrmRoute.length]);

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
          <Typography sx={{ color: "#ff2b2b", fontWeight: 800, fontSize: "1.2rem" }}>Live Mission</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>Broadcasting your location to {request?.name || "Requester"}</Typography>
        </Box>
      </Box>

      {/* Control Panel Overlay */}
      <Box sx={{
        position: "absolute", bottom: 20, left: 20, right: 20, zIndex: 1000,
        background: "rgba(20,20,20,0.85)", backdropFilter: "blur(12px)",
        borderRadius: 4, p: 2, border: "1px solid rgba(255,43,43,0.3)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: "#ff2b2b", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(255,43,43,0.4)" }}>
            <TwoWheelerIcon sx={{ color: "#fff" }} />
          </Box>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Sharing Location 🟢</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>{request?.hospital || "Hospital Destination"}</Typography>
          </Box>
        </Box>
        <Button variant="contained" color="error" sx={{ fontWeight: 800, borderRadius: 3 }} onClick={() => navigate("/donations")}>
          End Mission
        </Button>
      </Box>

      {/* Map */}
      <MapContainer 
        center={donorPos || destPos || [20, 78]} 
        zoom={14} 
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        />
        
        {donorPos && <MapRecenter center={donorPos} />}

        {/* Highlighted OSRM Road Route to Destination - Google Maps Style */}
        {osrmRoute.length > 0 && (
          <>
            <Polyline positions={osrmRoute} color="#0f53ff" weight={10} opacity={0.5} />
            <Polyline positions={osrmRoute} color="#3c82fa" weight={6} opacity={1} />
          </>
        )}

        {/* Trail Line (where the donor actually drove) */}
        {routeLine.length > 1 && (
          <Polyline positions={routeLine} color="#2196f3" weight={5} opacity={0.8} />
        )}

        {/* Donor Marker */}
        {donorPos && (
          <Marker position={donorPos} icon={BIKE_ICON}>
            <Popup>You are here</Popup>
          </Marker>
        )}

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
