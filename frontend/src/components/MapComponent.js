import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Typography, Button, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import NavigationIcon from '@mui/icons-material/Navigation';
import { authUtils } from '../utils/auth';

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
try {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(API_BASE)) {
            API_BASE = API_BASE.replace(/localhost|127\.0\.0\.1/, host);
        }
    }
} catch (e) { }

// ── Fix webpack default icon paths ───────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ── Custom blood-drop SVG marker ─────────────────────────────────────────────
const makeBloodIcon = (bloodGroup = '') => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="58" viewBox="0 0 44 58">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <!-- Shadow -->
      <ellipse cx="22" cy="56" rx="10" ry="3" fill="rgba(0,0,0,0.35)"/>
      <!-- Drop body -->
      <path d="M22 2 C22 2 4 22 4 36 C4 47.05 12.95 56 22 56 C31.05 56 40 47.05 40 36 C40 22 22 2 22 2Z"
            fill="url(#rg)" filter="url(#glow)" stroke="#ff6b6b" stroke-width="1.5"/>
      <defs>
        <radialGradient id="rg" cx="40%" cy="30%">
          <stop offset="0%" stop-color="#ff4c4c"/>
          <stop offset="100%" stop-color="#8b0000"/>
        </radialGradient>
      </defs>
      <!-- Highlight -->
      <ellipse cx="16" cy="28" rx="5" ry="8" fill="rgba(255,255,255,0.18)" transform="rotate(-20 16 28)"/>
      <!-- Blood group text -->
      <text x="22" y="42" text-anchor="middle" font-family="Arial" font-weight="900"
            font-size="${bloodGroup.length > 2 ? '9' : '11'}" fill="#fff">${bloodGroup || '?'}</text>
    </svg>`;
    return new L.DivIcon({
        html: svg,
        iconSize: [44, 58],
        iconAnchor: [22, 56],
        popupAnchor: [0, -58],
        className: '',
    });
};

// ── User location "pulse" marker ─────────────────────────────────────────────
const userIcon = new L.DivIcon({
    html: `
    <div style="position:relative;width:24px;height:24px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(255,43,43,0.35);
                  animation:pulse 1.8s ease-out infinite;"></div>
      <div style="position:absolute;inset:5px;border-radius:50%;background:#ff2b2b;border:2px solid #fff;
                  box-shadow:0 0 12px rgba(255,43,43,0.7);"></div>
    </div>
    <style>
      @keyframes pulse{0%{transform:scale(1);opacity:0.8}70%{transform:scale(2.8);opacity:0}100%{transform:scale(1);opacity:0}}
    </style>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
    className: '',
});

// ── AutoCenter helper ─────────────────────────────────────────────────────────
function AutoCenter({ center, zoom }) {
    const map = useMap();
    const prev = useRef(null);
    useEffect(() => {
        const key = JSON.stringify([center, zoom]);
        if (key !== prev.current) {
            map.setView(center, zoom, { animate: true, duration: 1 });
            prev.current = key;
        }
    }, [center, zoom, map]);
    return null;
}

// ── Blood group colors for urgency chips ────────────────────────────────────
const URGENCY_COLOR = {
    high: '#ff2b2b',
    medium: '#ff9800',
    low: '#4caf50',
    critical: '#ff0000',
};

// ── Main Component ────────────────────────────────────────────────────────────
const MapComponent = ({ requests = [], userLocation, onNavigate }) => {
    const defaultCenter = [20.5937, 78.9629];
    const center = userLocation?.lat ? [userLocation.lat, userLocation.lng] : defaultCenter;
    const zoom = userLocation?.lat ? 13 : 5;

    // stats
    const withLocation = requests.filter(r => r.location?.lat && r.location?.lng);
    const urgent = requests.filter(r => r.urgency === 'high' || r.urgency === 'critical').length;

    return (
        <Box>
            {/* ── Stats bar above map ── */}
            <Box sx={{
                display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap',
                px: 0.5,
            }}>
                {[
                    { label: 'Total Requests', value: requests.length, color: '#fff', bg: 'rgba(255,255,255,0.05)' },
                    { label: 'On Map', value: withLocation.length, color: '#4fc3f7', bg: 'rgba(79,195,247,0.08)' },
                    { label: 'Urgent', value: urgent, color: '#ff4c4c', bg: 'rgba(255,43,43,0.1)' },
                ].map(s => (
                    <Box key={s.label} sx={{
                        px: 2, py: 1, borderRadius: 2,
                        background: s.bg, border: `1px solid ${s.color}22`,
                        display: 'flex', alignItems: 'center', gap: 1.5,
                    }}>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: s.color, lineHeight: 1 }}>
                            {s.value}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.3 }}>
                            {s.label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Map ── */}
            <Box sx={{
                height: '440px', width: '100%',
                borderRadius: '16px', overflow: 'hidden',
                border: '1px solid rgba(255,43,43,0.2)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03)',
                position: 'relative',
            }}>
                <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    zoomControl={true}
                >
                    <AutoCenter center={center} zoom={zoom} />

                    {/* Dark map tiles (CartoDB Dark Matter) */}
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        subdomains="abcd"
                    />

                    {/* User location */}
                    {userLocation?.lat && (
                        <>
                            <Circle
                                center={[userLocation.lat, userLocation.lng]}
                                radius={800}
                                pathOptions={{ color: '#ff2b2b', fillColor: '#ff2b2b', fillOpacity: 0.06, weight: 1, dashArray: '4' }}
                            />
                            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                                <Popup>
                                    <Box sx={{ p: 0.5 }}>
                                        <Typography sx={{ fontWeight: 800, color: '#ff2b2b', fontSize: 13 }}>📍 You are here</Typography>
                                        <Typography sx={{ color: '#555', fontSize: 11, mt: 0.3 }}>Your current location</Typography>
                                    </Box>
                                </Popup>
                            </Marker>
                        </>
                    )}

                    {/* Blood request markers */}
                    {withLocation.map((req) => (
                        <Marker
                            key={req._id}
                            position={[req.location.lat, req.location.lng]}
                            icon={makeBloodIcon(req.bloodGroup)}
                        >
                            <Popup minWidth={220} maxWidth={260}>
                                <Box sx={{ fontFamily: 'Inter, sans-serif' }}>
                                    {/* Header */}
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1, mb: 1.5,
                                        pb: 1, borderBottom: '1px solid #eee',
                                    }}>
                                        <Box sx={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: 'linear-gradient(135deg,#b71c1c,#ff2b2b)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 900, color: '#fff', fontSize: 13, flexShrink: 0,
                                        }}>
                                            {req.bloodGroup || '?'}
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, color: '#c62828', fontSize: 13, lineHeight: 1.2 }}>
                                                {req.bloodGroup} Blood Needed
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, color: '#888' }}>{req.name}</Typography>
                                        </Box>
                                    </Box>

                                    {/* Details */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mb: 1.5 }}>
                                        {req.hospital && (
                                            <Typography sx={{ fontSize: 11.5, color: '#444' }}>
                                                🏥 <strong>{req.hospital}</strong>
                                            </Typography>
                                        )}
                                        {req.urgency && (
                                            <Typography sx={{ fontSize: 11.5 }}>
                                                🚨 Urgency: <strong style={{ color: URGENCY_COLOR[req.urgency?.toLowerCase()] || '#555' }}>
                                                    {req.urgency?.toUpperCase()}
                                                </strong>
                                            </Typography>
                                        )}
                                        {req.distanceKm && (
                                            <Typography sx={{ fontSize: 11, color: '#777' }}>
                                                📍 {req.distanceKm} km away
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Action buttons */}
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <button
                                            style={{
                                                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none',
                                                background: 'linear-gradient(135deg,#ff2b2b,#b60000)',
                                                color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                                            }}
                                            onClick={() => window.location.href = `/donate?id=${req._id}`}
                                        >
                                            🩸 Donate
                                        </button>
                                        <button
                                            style={{
                                                flex: 1, padding: '7px 0', borderRadius: 8,
                                                border: '1px solid #ddd', background: '#f9f9f9',
                                                color: '#333', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                if (onNavigate) {
                                                    onNavigate(req);
                                                } else {
                                                    // Trigger background pledge email when navigating natively
                                                    fetch(`${API_BASE}/api/requests/interest/${req._id}`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            ...authUtils.getAuthHeaders()
                                                        }
                                                    }).catch(e => console.warn('Background interest registration network error', e));

                                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${req.location.lat},${req.location.lng}`, '_blank');
                                                }
                                            }}
                                        >
                                            🗺️ Navigate
                                        </button>
                                    </Box>
                                </Box>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Overlay legend */}
                <Box sx={{
                    position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
                    background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 2, px: 1.5, py: 1,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    pointerEvents: 'none',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff2b2b', boxShadow: '0 0 6px #ff2b2b' }} />
                        <Typography sx={{ fontSize: 10, color: '#aaa' }}>Blood Request</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#fff', border: '2px solid #ff2b2b' }} />
                        <Typography sx={{ fontSize: 10, color: '#aaa' }}>You</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default MapComponent;
