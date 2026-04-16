// frontend/src/pages/Donate.js
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
  Switch,
  Grid,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Chip,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuIcon from "@mui/icons-material/Menu";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LogoutIcon from "@mui/icons-material/Logout";
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
// removed topbar icons - only profile/avatar remains


import PublicIcon from "@mui/icons-material/Public";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import RequestFilters from "../components/Filters/RequestFilters";
import { authUtils } from "../utils/auth";

/**
 * If you're using Firebase in your app (recommended): ensure firebase is initialized
 * in a module like src/firebase.js and export nothing or export the app. We will
 * dynamically import firebase/auth to avoid breaking apps that do not have Firebase.
 *
 * Example src/firebase.js (if you need):
 * import { initializeApp } from "firebase/app";
 * const firebaseConfig = { apiKey: "...", authDomain: "...", ... };
 * const app = initializeApp(firebaseConfig);
 * export default app;
 *
 * The code below will attempt to use firebase auth if present.
 */

// Compute API base: allow overriding REACT_APP_API_BASE, and when it points to localhost
// replace localhost with the current host so LAN devices call the correct backend.
let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
try {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && !/(^localhost$|^127\.0\.0\.1$)/.test(host) && /localhost|127\.0\.0\.1/.test(API_BASE)) {
      API_BASE = API_BASE.replace(/localhost|127\.0\.0\.1/, host);
    }
  }
} catch (e) {
  // ignore
}

export default function Donate() {
  const { t } = useTranslation();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [active] = useState("donate");
  const isMobile = useMediaQuery("(max-width:900px)");
  const navigate = useNavigate();

  // Profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  const profileOpen = Boolean(anchorEl);

  // Live data
  const [user, setUser] = useState(null);
  const userRef = React.useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [available, setAvailable] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  const [matchingRequests, setMatchingRequests] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Modal to collect donor phone (polite UI) when server requires it
  // const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneDialogValue, setPhoneDialogValue] = useState("");
  const [ageDialogValue, setAgeDialogValue] = useState("");
  const [pendingOfferRequest, setPendingOfferRequest] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'call' | 'navigate'
  const [phoneDialogSubmitting, setPhoneDialogSubmitting] = useState(false);
  // notNow modal state
  const [notNowDialogOpen, setNotNowDialogOpen] = useState(false);
  // Missing blood group dialog
  // const [missingBloodOpen, setMissingBloodOpen] = useState(false);
  const [selectedBlood, setSelectedBlood] = useState("A+");

  // Keep last known coords to include with availability updates
  const [coords, setCoords] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState(null);
  const coordsRef = React.useRef(coords);
  useEffect(() => { coordsRef.current = coords; }, [coords]);

  // Filters State
  const [activeFilters, setActiveFilters] = useState({
    bloodGroup: "all",
    urgency: "all",
    hospital: "",
    maxDistance: 50,
    sortBy: "nearest",
  });

  // Mobile device detection
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Keep ref to last attempted value so we can rollback on failure
  const [lastAttemptValue, setLastAttemptValue] = useState(null);



  useEffect(() => {
    // load user (from backend) and list of requests
    fetchUser();

    // mark as available by default when opening donate page
    (async () => {
      try {
        // small delay to allow fetchUser to populate
        await new Promise((r) => setTimeout(r, 300));
        setAvailable(true);
        updateAvailability(true);
      } catch (e) {
        // ignore
      }
    })();

    loadRequests();

    const onUpdated = () => fetchUser();
    try { window.addEventListener('user-updated', onUpdated); } catch (e) { }

    // get geolocation (non blocking)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          fetchAddressFromCoords(latitude, longitude);
        },
        (err) => {
          // ignore if denied
          console.warn("Geolocation not available:", err?.message || err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    // Increase auto-refresh interval on mobile for better performance
    const auto = setInterval(() => loadRequests(), isMobileDevice() ? 30000 : 12000);
    return () => { clearInterval(auto); try { window.removeEventListener('user-updated', onUpdated); } catch (e) { } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAddressFromCoords(lat, lng) {
    try {
      const apiKey = process.env.REACT_APP_GEOAPIFY_API_KEY;
      if (!apiKey) return;

      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const props = data.features[0].properties;

          // Construct a more specific address
          // Priority: Name (e.g. Price Hostel) -> Street -> Suburb -> City
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

          setDetectedAddress(address);
        }
      }
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
    }
  }

  async function fetchUser() {
    try {
      const res = await fetch(`${API_BASE}/api/user/me`, {
        credentials: "include",
        headers: authUtils.getAuthHeaders(),
      });
      if (!res.ok) {
        console.warn("/api/user/me not ok:", res.status);
        if (res.status === 401) {
          authUtils.logout();
          navigate("/login");
        }
        return;
      }
      let data = await res.json();
      // If server returned a user but blood info is missing, merge in any recently-created profile saved at registration time
      try {
        const saved = localStorage.getItem("newUserProfile");
        if (saved) {
          const parsed = JSON.parse(saved);
          // if backend didn't provide blood, prefer whatever user submitted at registration
          if ((!(data.bloodGroup || data.blood)) && parsed) {
            data.blood = data.blood || parsed.blood || parsed.bloodGroup || data.blood;
            data.bloodGroup = data.bloodGroup || data.blood;
          }
          // clear the transient storage after merging
          localStorage.removeItem("newUserProfile");
        }
      } catch (e) {
        // ignore localStorage errors
      }

      setUser(data);
      let newCoords = null;
      if (data.locationGeo?.coordinates?.length === 2) {
        newCoords = { lat: data.locationGeo.coordinates[1], lng: data.locationGeo.coordinates[0] };
        setCoords(newCoords);
      } else if (data.location?.lat && data.location?.lng) {
        newCoords = { lat: data.location.lat, lng: data.location.lng };
        setCoords(newCoords);
      }

      try { await loadRequests(data, newCoords); } catch (e) { /* ignore */ }
      setAvailable(Boolean(data.isAvailable || data.available));

      // Do not interrupt donation flow with popups — prefer to keep data in profile and use it directly.
      // If bloodGroup missing, we'll still proceed but server may require it; createOfferOnServer will try to include profile values.
    } catch (err) {
      console.warn("fetchUser failed:", err?.message || err);
    }
  }

  // deprecated

  // Load nearby blood requests (people who requested blood)
  async function loadRequests(userForMatch, coordsOverride, currentFilters) {
    setLoadingRequests(true);
    try {
      const matchingUser = userForMatch || userRef.current;
      let currentCoords = coordsOverride || coordsRef.current;
      const filtersToUse = currentFilters || activeFilters;

      // Fallback: if browser GPS not yet available, pull from user profile location
      if (!currentCoords && matchingUser) {
        if (matchingUser.locationGeo?.coordinates?.length === 2) {
          const [lng, lat] = matchingUser.locationGeo.coordinates;
          currentCoords = { lat, lng };
        } else if (matchingUser.location?.lat && matchingUser.location?.lng) {
          currentCoords = { lat: matchingUser.location.lat, lng: matchingUser.location.lng };
        }
      }

      // Construct query string
      // NOTE: bloodGroup is intentionally NOT filtered server-side so all 3 boxes get populated
      const params = new URLSearchParams({
        limit: 100,
        urgency: filtersToUse.urgency || 'all',
        hospital: filtersToUse.hospital || '',
        sortBy: filtersToUse.sortBy || 'nearest',
      });

      if (currentCoords && typeof currentCoords.lat === "number" && typeof currentCoords.lng === "number") {
        params.append("lat", currentCoords.lat);
        params.append("lng", currentCoords.lng);
      }

      const res = await fetch(`${API_BASE}/api/requests/recent?${params.toString()}`, {
        credentials: "include",
        headers: authUtils.getAuthHeaders()
      });
      const data = res.ok ? await res.json().catch(() => []) : [];

      const match50km = [];
      const different50km = [];
      const otherRequests = [];

      const userBlood = matchingUser && (matchingUser.bloodGroup || matchingUser.blood)
        ? (matchingUser.bloodGroup || matchingUser.blood).trim().toLowerCase()
        : null;

      data.forEach((r) => {
        // Prevent self-donation (UI filter fallback)
        const isSelf = (r.requesterId && matchingUser?._id && String(r.requesterId) === String(matchingUser._id)) ||
          (r.uid && matchingUser?.uid && r.uid === matchingUser.uid);

        if (isSelf) return;

        const reqBlood = (r.bloodGroup || r.blood || '').trim().toLowerCase();
        const distance = r.distanceKm != null ? parseFloat(r.distanceKm) : null;

        const isSameBlood = userBlood && reqBlood && reqBlood === userBlood;
        const isWithin50km = distance !== null && distance <= 50;

        if (isSameBlood && isWithin50km) {
          match50km.push(r);         // ✅ Box 1: Same blood, within 50km
        } else if (isWithin50km) {
          different50km.push(r);     // ✅ Box 2: Different blood, within 50km
        } else {
          otherRequests.push(r);     // ✅ Box 3: Outside 50km OR no location data
        }
      });

      setMatchingRequests(match50km);
      setNearbyRequests(different50km);
      setAllRequests(otherRequests);
    } catch (e) {
      console.error("loadRequests error:", e);
    }
    setLoadingRequests(false);
  }


  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    loadRequests(user, coords, newFilters);
  };

  // Open Google Maps directions with source (donor) and destination (request)
  async function openMapForRequest(request) {
    try {
      // Destination: prefer explicit location, then locationGeo
      let dstLat = null;
      let dstLng = null;
      if (request.location && typeof request.location.lat === 'number' && typeof request.location.lng === 'number') {
        dstLat = request.location.lat;
        dstLng = request.location.lng;
      } else if (request.locationGeo && Array.isArray(request.locationGeo.coordinates) && request.locationGeo.coordinates.length >= 2) {
        dstLng = request.locationGeo.coordinates[0];
        dstLat = request.locationGeo.coordinates[1];
      }
      let destinationParam = null;
      if (dstLat == null || dstLng == null) {
        // Best-effort: try to geocode hospital using Nominatim (OpenStreetMap)
        const destText = request.hospital;
        if (destText) {
          try {
            // Nominatim search
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(destText)}&limit=1`;
            const r = await fetch(searchUrl, { method: 'GET' });
            if (r.ok) {
              const hits = await r.json();
              if (Array.isArray(hits) && hits.length > 0) {
                const first = hits[0];
                const latN = parseFloat(first.lat);
                const lonN = parseFloat(first.lon);
                if (!Number.isNaN(latN) && !Number.isNaN(lonN)) {
                  dstLat = latN;
                  dstLng = lonN;
                }
              }
            }
          } catch (e) {
            // geocode failed; fall back
            console.warn('Nominatim geocode failed:', e);
          }

          if (dstLat == null || dstLng == null) {
            // fallback to text destination which will show search results in Maps
            destinationParam = encodeURIComponent(destText);
          }
        } else {
          alert('Destination coordinates not available for this request.');
          return;
        }
      }

      // Source: prefer a fresh live geolocation reading (donor live location)
      let srcLat = null;
      let srcLng = null;
      if (navigator.geolocation) {
        try {
          // try to get a live, quick geolocation reading first (useful on mobile)
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
          );
          srcLat = pos.coords.latitude;
          srcLng = pos.coords.longitude;
        } catch (e) {
          // if live geolocation failed or timed out, fall back to cached coords from state (last-known)
          if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
            srcLat = coords.lat;
            srcLng = coords.lng;
          }
        }
      } else if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        srcLat = coords.lat;
        srcLng = coords.lng;
      }

      // helper: calculate distance in kilometers between two lat/lng points
      function distanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius km
        const toRad = (d) => (d * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }

      // If geocode found destination coordinates that are suspiciously close to the source
      // (for example geocoder returned the user's own location), prefer textual destination so
      // Google Maps displays meaningful search results instead of duplicate locations.
      if (!destinationParam && typeof dstLat === 'number' && typeof dstLng === 'number' && typeof srcLat === 'number' && typeof srcLng === 'number') {
        try {
          const d = distanceKm(srcLat, srcLng, dstLat, dstLng);
          if (d < 0.5) {
            // destination is less than ~500m from source — likely incorrect geocoding; use text search fallback
            const destText = request.hospital;
            if (destText) destinationParam = encodeURIComponent(destText);
          }
        } catch (e) {
          // ignore any math issues
        }
      }

      // Build Google Maps directions URL
      let url = 'https://www.google.com/maps/dir/?api=1';
      if (typeof srcLat === 'number' && typeof srcLng === 'number') {
        // Use lat,lng origin when available — this helps Google Maps auto-fill the 'From' field
        url += `&origin=${encodeURIComponent(`${srcLat},${srcLng}`)}`;
      }
      if (destinationParam) {
        // If destinationParam is a text address (encoded), use it directly
        url += `&destination=${destinationParam}`;
      } else {
        url += `&destination=${encodeURIComponent(`${dstLat},${dstLng}`)}`;
      }
      url += '&travelmode=driving';

      // debug: show what will be opened
      try { console.debug('Opening directions', { origin: srcLat && srcLng ? `${srcLat},${srcLng}` : null, destination: destinationParam ? decodeURIComponent(destinationParam) : `${dstLat},${dstLng}` }); } catch (e) { }

      // On mobile devices, use window.location.href to ensure Maps app opens properly
      if (isMobileDevice()) {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error('openMapForRequest failed:', e);
      alert('Failed to open map.');
    }
  }

  // Create an Offer on the server which will email the donor a confirmation poll
  async function createOfferOnServer(request, extra = {}) {
    try {
      const headers = authUtils.getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const body = { requestId: request._id };
      // debug log: outgoing offer request
      try { console.debug('createOfferOnServer -> POST', `${API_BASE}/api/notify/offer`, { headers, body }); } catch (e) { }
      // attach any extra fields passed by caller (e.g. donorPhone, donorAge)
      Object.assign(body, extra || {});

      // Fill missing donor details from currently loaded user profile (avoid asking in a popup)
      try {
        // donorPhone: prefer explicitly supplied extra, otherwise user's phone
        if (!body.donorPhone && user?.phone) body.donorPhone = user.phone;

        // donorAge: prefer explicit extra, otherwise user.age or compute from dateOfBirth
        if (!body.donorAge) {
          if (user?.age) body.donorAge = Number(user.age) || user.age;
          else if (user?.dateOfBirth) {
            const dob = new Date(user.dateOfBirth);
            if (!Number.isNaN(dob.getTime())) {
              const now = new Date();
              let age = now.getFullYear() - dob.getFullYear();
              const m = now.getMonth() - dob.getMonth();
              if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
              body.donorAge = age;
            }
          }
        }

        // bloodGroup: prefer explicit, otherwise try user.bloodGroup or user.blood
        if (!body.bloodGroup) body.bloodGroup = user?.bloodGroup || user?.blood || undefined;
      } catch (e) {
        // ignore any profile parsing errors
      }
      let res = await fetch(`${API_BASE}/api/notify/offer`, { method: 'POST', headers, credentials: 'include', body: JSON.stringify(body) });
      if (!res.ok) {
        // Try to parse JSON error (e.g. missing_donor_phone). If missing phone, prompt donor
        let errJson = null;
        try { errJson = await res.json(); } catch (e) { /* ignored */ }
        if (errJson && errJson.error === 'missing_donor_phone') {
          // We no longer collect donor phone via an inline dialog. Ask user to update their profile instead.
          try {
            await Swal.fire({
              title: t('phoneRequired'),
              text: t('phoneRequiredMessage'),
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: t('openProfile'),
            }).then((r) => {
              if (r.isConfirmed) navigate('/profile');
            });
          } catch (e) { }
          return { ok: false, error: 'missing_donor_phone' };
        }

        const txt = (errJson && (errJson.message || errJson.error)) || await res.text().catch(() => '');
        console.warn('createOfferOnServer failed', res.status, txt);
        alert(t('failedToCreateOffer') + ': ' + (txt || res.status));
        return { ok: false, error: txt || res.status };
      }
      const json = await res.json().catch(() => null);
      console.debug('createOfferOnServer response', json);

      // Server may return a WhatsApp prefilled link in json.whatsapp; return it to the caller

      return { ok: true, data: json };
    } catch (e) {
      console.error('createOfferOnServer error:', e);
      alert(t('networkError'));
      return { ok: false, error: e?.message || e };
    }
  }

  // function handlePhoneDialogSubmit() { ... } // Removed
  // function handlePhoneDialogCancel() { ... } // Removed

  // ── WhatsApp helper: generates bilingual prefilled message via Groq ───────
  async function openWhatsAppWithMessage(request) {
    if (!request.phone) { alert('Phone number not available'); return; }

    let waPhone = request.phone.replace(/\D/g, '');
    if (waPhone.length === 10) waPhone = '91' + waPhone;

    // Donor's current i18n language (stored in localStorage by i18next)
    const donorLang = localStorage.getItem('i18nextLng') || 'en';
    // Requester's preferred language — stored in their profile, default to 'en'
    const requesterLang = request.preferredLanguage || request.language || 'en';

    // Build a friendly fallback in case the API fails
    const fallbackMsg =
      `🩸 *Blood Donation Offer – Real-Hero*\n\nHello! My name is *${user?.name || 'A donor'}*. I saw your blood request on the *Real-Hero* platform and I am ready to help.\n\n• Blood Group: ${user?.bloodGroup || user?.blood || 'N/A'}\n• Hospital: ${request.hospital || 'N/A'}\n\nPlease confirm if you still need a donor. I will reach the hospital as soon as possible.\n\n🙏 Stay strong — help is on the way!\n(Sent via Real-Hero platform)`;

    try {
      const res = await fetch(`${API_BASE}/api/translate/whatsapp-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeaders() },
        body: JSON.stringify({
          donorName: user?.name || 'A donor',
          donorBlood: user?.bloodGroup || user?.blood || '',
          donorLang,
          requesterLang,
          requestDetails: {
            name: request.name,
            bloodGroup: request.bloodGroup || request.blood,
            hospital: request.hospital,
            urgency: request.urgency,
            distanceKm: request.distanceKm,
          },
        }),
      });
      const data = res.ok ? await res.json() : null;
      const msg = data?.message?.trim() || fallbackMsg;
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (e) {
      console.warn('WhatsApp message generation failed, using fallback:', e);
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(fallbackMsg)}`, '_blank');
    }
  }

  async function openConfirmAndProceed(request, action) {
    // Shared execution logic wrapper to run after API calls
    const executeContactAction = async (req, act) => {
      if (act === 'call') {
        window.location.href = `tel:${req.phone || ''}`;
        return true;
      } else if (act === 'navigate') {
        await openMapForRequest(req);
        return true;
      } else if (act === 'whatsapp') {
        await openWhatsAppWithMessage(req);
        return true;
      }
      return true;
    };

    // 6-Hour Watchlist / Cooldown check
    // If request is not urgent AND user donated recently (< 90 days)
    if (request.urgency !== 'high' && user?.lastDonation && !request.isSelf) {
      const lastDonationDate = new Date(user.lastDonation);
      const daysSince = (new Date() - lastDonationDate) / (1000 * 60 * 60 * 24);

      if (daysSince < 90) {
        const nextEligibleDate = new Date(lastDonationDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        const formattedDate = nextEligibleDate.toLocaleDateString();

        Swal.fire({
          title: "Take Care of Yourself ❤️",
          text: `We saw your kindness towards him, but as per our guidelines, we want to take care of yourself too. Your next donation date is ${formattedDate}. So please understand the situation. If no user accepts this request within 6 hours, we will notify you.`,
          icon: "info",
          confirmButtonColor: "#ff2b2b",
          confirmButtonText: "I Understand",
          showDenyButton: true,
          denyButtonText: "No problem, I will Donate 💪",
          denyButtonColor: "#1a8a2e",
          background: '#1a1a1a',
          color: '#fff',
          reverseButtons: false,
        }).then(async (result) => {
          if (result.isDenied) {
            // User chose to donate despite the cooldown — celebrate their courage without blocking!
            Swal.fire({
              title: "You're a True Hero! 🦸",
              html: `
                <div style="text-align:center;">
                  <div style="font-size:3rem;margin-bottom:12px;">🩸💪❤️</div>
                  <p style="color:rgba(255,255,255,0.85);font-size:1rem;line-height:1.6;margin:0 0 8px 0;">
                    Your courage and selflessness are truly inspiring. By stepping up when others might hesitate, you're making a real difference in someone's life.
                  </p>
                  <p style="color:#4caf50;font-size:0.9rem;font-weight:700;margin:0;">
                    Thank you for being a lifesaver. We're honored to have heroes like you! 🌟
                  </p>
                </div>
              `,
              confirmButtonText: "Let's Do This! 🚀",
              confirmButtonColor: "#ff2b2b",
              background: '#111',
              color: '#fff',
              showClass: { popup: 'animate__animated animate__heartBeat' },
              customClass: { title: 'swal-hero-title' },
              timer: 5000,
              timerProgressBar: true,
            });

            // Silently register as watcher and also proceed with the original action
            fetch(`${API_BASE}/api/requests/watch/${request._id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeaders() }
            }).catch(e => console.warn('Background watch registration error', e));

            // Proceed with donation action
            setPendingOfferRequest(request);
            setPendingAction(action);

            // Execute the contact action first (to avoid popup blocker due to async delay)
            // Execute the contact action first (to avoid popup blocker due to async delay)
            const proceeded = await executeContactAction(request, action);
            if (!proceeded) return;

            fetch(`${API_BASE}/api/requests/interest/${request._id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeaders() },
              body: JSON.stringify({ uid: user?.uid })
            }).catch(err => console.error("Error registering interest:", err));
          }
          // If 'I Understand' — do nothing, just close
        });

        // Register as watcher silently (regardless of button choice, user showed intent)
        fetch(`${API_BASE}/api/requests/watch/${request._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authUtils.getAuthHeaders()
          }
        }).catch(e => console.warn('Background watch registration error', e));

        return; // Halt normal flow
      }
    }

    // Directly attempt to create an offer using profile data (no inline prompt).
    setPendingOfferRequest(request);
    setPendingAction(action);

    // Execute the contact action first (to avoid popup blocker due to async delay)
    // Wait for the action (e.g. Swal) to complete. If they cancel, don't register interest.
    const proceeded = await executeContactAction(request, action);
    if (!proceeded) return;

    fetch(`${API_BASE}/api/requests/interest/${request._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authUtils.getAuthHeaders()
      },
      body: JSON.stringify({ uid: user?.uid })
    })
      .then(res => res.json())
      .catch(err => console.error("Error registering interest:", err));
  }

  // Robust availability update:
  // - optimistic UI update (immediate)
  // - include uid (from user state or firebase currentUser)
  // - include idToken in Authorization header when possible
  // - rollback if request fails
  async function updateAvailability(value, locationOverride) {
    // ignore if already saving
    if (savingAvail) return;

    // optimistic update
    const prev = available;
    setAvailable(value);
    setSavingAvail(true);
    setLastAttemptValue(value);

    let uid = user?.uid || user?._id;

    try {
      if (!uid) {
        const headers = authUtils.getAuthHeaders();
        const me = await fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers });
        if (me.ok) {
          const d = await me.json();
          uid = d.uid || d._id || d.id;
        }
      }

      if (!uid) {
        // we cannot send availability without a UID
        setAvailable(prev);
        alert(t('userUidMissing'));
        setSavingAvail(false);
        return;
      }

      const body = { uid, available: value };
      if (locationOverride && typeof locationOverride.lat === "number" && typeof locationOverride.lng === "number") {
        body.location = { lat: locationOverride.lat, lng: locationOverride.lng };
      } else if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
        body.location = { lat: coords.lat, lng: coords.lng };
      }

      const headers = { "Content-Type": "application/json", ...authUtils.getAuthHeaders() };

      const res = await fetch(`${API_BASE}/api/donors/availability`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = `Server returned ${res.status}`;
        try {
          const json = await res.json();
          msg = json?.message || json?.error || JSON.stringify(json);
        } catch {
          const txt = await res.text().catch(() => "");
          if (txt) msg = txt;
        }
        setAvailable(prev);
        console.error("updateAvailability failed:", msg);
        alert(`${t('failedToUpdateAvailability')}:\n${msg}`);
        setSavingAvail(false);
        return;
      }

      const data = await res.json();
      setAvailable(Boolean(data.available ?? value));
    } catch (err) {
      console.error("updateAvailability unexpected error:", err);
      setAvailable(prev);
      alert(`${t('failedToUpdateAvailability')}\n(see console for details)`);
    } finally {
      setSavingAvail(false);
    }
  }

  // function handleSaveBlood() { ... } // Removed

  const initials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  // Friendly display helper to avoid showing 'Unknown' when a value exists but is empty
  const displayBlood = () => {
    const b = user?.bloodGroup || user?.blood || "";
    const trimmed = String(b).trim();
    return trimmed.length ? trimmed : "Unknown";
  };

  // Compute distance between two coordinates (km)
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Sidebar is now imported

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
      {/* TOP NAVBAR */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2, md: 6 }, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpenSidebar(true)}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h4" sx={{ color: "#ff2b2b", fontWeight: 800, textShadow: "0 0 18px rgba(255,20,20,0.85)", display: { xs: "none", md: "block" } }}>
            {t('donateBlood')}
          </Typography>
        </Box>

        {/* NAVBUTTONS */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* only profile avatar shown */}

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar src={user?.profilePhoto} sx={{ bgcolor: "#ff2b2b", border: "2px solid rgba(255,43,43,0.5)" }}>{!user?.profilePhoto && initials(user?.name)}</Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
              <Typography variant="caption" sx={{ color: "#777" }}>{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
              {t('profile')}
            </MenuItem>
            <MenuItem onClick={() => (window.location.href = "/")}><LogoutIcon fontSize="small" sx={{ mr: 1 }} /> {t('logout')}</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* PAGE BODY */}
      <Box sx={{ display: "flex", gap: 4, px: { xs: 2, md: 6 } }}>
        {/* SIDEBAR */}
        {!isMobile && <Box sx={{ width: 260, mt: 2 }}><Box sx={{ position: "sticky", top: 24 }}><Sidebar /></Box></Box>}
        {isMobile && <Drawer open={openSidebar} onClose={() => setOpenSidebar(false)}><Sidebar onClose={() => setOpenSidebar(false)} /></Drawer>}

        {/* MAIN CONTENT */}
        <Box sx={{ flex: 1, pt: 3, minWidth: 0 }}>
          {/* PROFILE + AVAILABILITY (Hero Style) */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Box sx={{
              flex: 1,
              position: "relative",
              borderRadius: 4,
              overflow: "hidden",
              p: { xs: 3, md: 4 },
              background: "linear-gradient(135deg, #1a0000 0%, #2d0505 40%, #1a0000 100%)",
              border: "1px solid rgba(255,43,43,0.25)",
              boxShadow: "0 8px 48px rgba(255,43,43,0.12)",
            }}>
              {/* Glow orb */}
              <Box sx={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,43,43,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <Avatar src={user?.profilePhoto}
                    sx={{ width: 68, height: 68, bgcolor: "#ff2b2b", fontSize: "1.8rem", fontWeight: 900, border: "3px solid rgba(255,43,43,0.5)", boxShadow: "0 0 24px rgba(255,43,43,0.35)" }}>
                    {!user?.profilePhoto && initials(user?.name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.4rem", md: "1.8rem" }, lineHeight: 1.1, textTransform: "uppercase" }}>
                      {user?.name}
                      {coords && !isMobile && <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginLeft: '12px', fontWeight: 600 }}>({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</span>}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5, fontSize: "0.9rem" }}>{user?.email}</Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, flexWrap: "wrap" }}>
                      <Typography variant="caption" sx={{ color: "#ddd", fontSize: "0.85rem" }}>
                        {t('bloodGroupLabel')} <strong>{displayBlood()}</strong>
                        {!(user?.bloodGroup || user?.blood) && (
                          <Button size="small" variant="text" onClick={() => navigate('/profile')} sx={{ ml: 1, color: '#ff4c4c', textTransform: 'none', fontWeight: 700 }}>
                            {t('setProfile')}
                          </Button>
                        )}
                        &nbsp;<span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>&nbsp; {t('lastDonation')}: {user?.lastDonation ?? "—"}
                      </Typography>
                    </Box>

                    {detectedAddress && (
                      <Typography variant="caption" sx={{ color: "#ff4c4c", display: "inline-flex", alignItems: "center", mt: 0.5, fontWeight: 600, fontSize: "0.8rem", background: "rgba(255,43,43,0.1)", px: 1, py: 0.3, borderRadius: 1 }}>
                        📍 {detectedAddress}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ textAlign: { xs: "left", sm: "right" }, display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", sm: "flex-end" } }}>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", fontSize: "0.75rem", mb: 0.5 }}>{t('availability')} Status</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Switch
                      checked={available}
                      onChange={(e) => updateAvailability(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff2b2b' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#ff2b2b' },
                      }}
                      disabled={savingAvail}
                    />
                    {savingAvail && <CircularProgress size={18} sx={{ color: "#ff2b2b" }} />}
                    <Typography sx={{ fontSize: "0.8rem", color: available ? "#ff4c4c" : "#888", fontWeight: 700, minWidth: 60 }}>
                      {available ? "READY" : "OFFLINE"}
                    </Typography>

                    <Button variant="outlined" onClick={async () => {
                      if (!navigator.geolocation) {
                        alert(t('geolocationNotSupported'));
                        return;
                      }
                      try {
                        const pos = await new Promise((resolve, reject) =>
                          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 20000 })
                        );
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        setCoords({ lat, lng });
                        await fetchAddressFromCoords(lat, lng);
                        await loadRequests(null, { lat, lng });
                        await updateAvailability(true, { lat, lng });
                      } catch (err) {
                        console.error("Detect location failed:", err);
                        alert(t('failedToDetectLocation') + ": " + (err?.message || "unknown"));
                      }
                    }} sx={{ ml: 2, color: '#fff', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 2, fontWeight: 700, px: 2, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                      {t('detectMyLocation')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* LIVE IMPACT STATS */}
          <Box sx={{ display: "flex", gap: 2, mb: 5, flexDirection: { xs: "column", md: "row" } }}>
            {/* Stat 1: Lives Saved */}
            <Box sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2.5,
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(12px)",
              borderRadius: 3,
              border: "1px solid rgba(255,43,43,0.15)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "transform 0.2s ease, background 0.2s ease",
              '&:hover': { transform: "translateY(-2px)", background: "rgba(255,43,43,0.04)" }
            }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #ff2b2b, #b71c1c)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(255,43,43,0.4)" }}>
                <FavoriteIcon sx={{ color: "#fff", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Lives Saved</Typography>
                <Typography sx={{ color: "#fff", fontSize: "1.6rem", fontWeight: 900, lineHeight: 1 }}>
                  {user?.donationsCount ? (user.donationsCount * 3) : 0} <span style={{ fontSize: "0.9rem", color: "#ff4c4c", fontWeight: 700 }}>PEOPLE</span>
                </Typography>
              </Box>
            </Box>

            {/* Stat 2: Total Donations */}
            <Box sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2.5,
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(12px)",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "transform 0.2s ease, background 0.2s ease",
              '&:hover': { transform: "translateY(-2px)", background: "rgba(255,255,255,0.04)" }
            }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BloodtypeIcon sx={{ color: "#aaa", fontSize: 26 }} />
              </Box>
              <Box>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Donations</Typography>
                <Typography sx={{ color: "#fff", fontSize: "1.6rem", fontWeight: 900, lineHeight: 1 }}>
                  {user?.donationsCount || 0} <span style={{ fontSize: "0.9rem", color: "#aaa", fontWeight: 700 }}>UNITS</span>
                </Typography>
              </Box>
            </Box>

            {/* Stat 3: Next Eligible Date */}
            <Box sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2.5,
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(12px)",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "transform 0.2s ease, background 0.2s ease",
              '&:hover': { transform: "translateY(-2px)", background: "rgba(255,255,255,0.04)" }
            }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarMonthIcon sx={{ color: "#aaa", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Next Eligible Date</Typography>
                <Typography sx={{ color: "#4caf50", fontSize: "1.2rem", fontWeight: 800, mt: 0.5, lineHeight: 1.2 }}>
                  {(() => {
                    if (!user?.lastDonation) return "Donate Now";
                    const eligibleDate = new Date(new Date(user.lastDonation).getTime() + 90 * 24 * 60 * 60 * 1000);
                    if (eligibleDate <= new Date()) return "Donate Now";
                    return eligibleDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  })()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ADVANCED FILTERS REMOVED PER USER REQUEST */}


          {/* NEARBY BLOOD REQUESTS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 2 }}>
            <Box sx={{ width: 4, height: 24, borderRadius: 2, background: "#ff2b2b" }} />
            <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: '1.4rem' }}>
              {t('bloodDonationCenter')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Column 1: same blood group within 50 km */}
            <Box sx={{
              flex: 1,
              background: "linear-gradient(180deg, rgba(255,43,43,0.08) 0%, rgba(0,0,0,0) 100%)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,43,43,0.3)",
              p: 2.5,
              borderRadius: 4,
              boxShadow: "0 8px 32px rgba(255,43,43,0.1)",
              position: "relative",
              overflow: "hidden"
            }}>
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #ff2b2b, #b71c1c)" }} />
              <Typography sx={{ fontWeight: 800, color: "#fff", mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: "1.1rem" }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#b71c1c,#ff2b2b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, boxShadow: "0 2px 8px rgba(255,43,43,0.4)" }}>1</Box>
                {t('sameBloodGroup')}
              </Typography>
              {loadingRequests ? (
                <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress color="error" /></Box>
              ) : matchingRequests.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: 2, border: "1px dashed rgba(255,255,255,0.1)" }}>
                  <Typography sx={{ color: "#aaa", fontSize: '0.95rem' }}>{t('noMatchingRequests')}</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {matchingRequests.map((r) => (
                    <Grid item xs={12} key={r._id}>
                      <Card
                        onClick={() => setSelectedRequest(r)}
                        sx={{
                          p: 2,
                          background: "rgba(255,255,255,0.03)",
                          border: '1px solid rgba(255,43,43,0.15)',
                          borderRadius: 3,
                          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': { background: 'rgba(255,43,43,0.05)', borderColor: 'rgba(255,43,43,0.4)', transform: 'translateY(-2px)' }
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                          <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>{r.name}</Typography>
                          <Chip label={r.bloodGroup ?? r.blood} size="small" sx={{ bgcolor: "#ff2b2b", color: "#fff", fontWeight: 900, height: 20, fontSize: 11 }} />
                        </Box>
                        <Typography variant="caption" sx={{ display: "block", color: "#aaa", mb: 0.5 }}>🏥 {r.hospital}</Typography>
                        {r.distanceKm && <Typography variant="caption" sx={{ color: "#ff4c4c", fontWeight: 600 }}>📍 {r.distanceKm} km away</Typography>}
                        <Typography sx={{ mt: 1, fontSize: '0.85rem', color: '#ccc', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</Typography>

                        <Box sx={{ display: 'flex', gap: 1, mt: 2.5 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => { e.stopPropagation(); openConfirmAndProceed(r, 'call'); }}
                            sx={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff", flex: 1, fontSize: '0.72rem', borderRadius: 2, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}
                          >
                            📞 {t('call')}
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => { e.stopPropagation(); openConfirmAndProceed(r, 'navigate'); }}
                            sx={{ background: 'linear-gradient(135deg,#ff2b2b,#b60000)', color: '#fff', flex: 1, fontSize: '0.72rem', borderRadius: 2, boxShadow: '0 4px 12px rgba(255,43,43,0.3)', '&:hover': { background: 'linear-gradient(135deg,#ff4c4c,#cc0000)' } }}
                          >
                            🗺️ {t('navigate')}
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => { e.stopPropagation(); openConfirmAndProceed(r, 'whatsapp'); }}
                            sx={{ background: 'linear-gradient(135deg,#25d366,#128c3a)', color: '#fff', flex: 1, fontSize: '0.72rem', borderRadius: 2, boxShadow: '0 4px 12px rgba(37,211,102,0.25)', '&:hover': { background: 'linear-gradient(135deg,#3de87c,#1aad50)' } }}
                          >
                            💬 WhatsApp
                          </Button>
                        </Box>

                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            {/* Column 2: different blood group within 50km */}
            <Box sx={{
              flex: 1,
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              p: 2.5,
              borderRadius: 4,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}>
              <Typography sx={{ fontWeight: 800, color: "#fff", mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: "1.05rem" }}>
                <Box sx={{ width: 26, height: 26, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 13 }}>2</Box>
                {t('differentBloodGroup')}
              </Typography>
              {loadingRequests ? (
                <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress color="inherit" sx={{ color: "#666" }} /></Box>
              ) : nearbyRequests.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: 2, border: "1px dashed rgba(255,255,255,0.05)" }}>
                  <Typography sx={{ color: "#888", fontSize: '0.9rem' }}>{t('noDifferentRequests')}</Typography>
                </Box>
              ) : (
                <Box>
                  {nearbyRequests.map((r) => (
                    <Card key={r._id} onClick={() => setSelectedRequest(r)} sx={{ p: 2, mb: 1.5, background: "rgba(255,255,255,0.02)", border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2.5, cursor: 'pointer', transition: 'all 0.2s ease', '&:hover': { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', transform: 'translateX(4px)' } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: "#eee" }}>{r.name}</Typography>
                        <Chip label={r.bloodGroup ?? r.blood} size="small" sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#bbb", fontWeight: 700, height: 18, fontSize: 10 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: "#888", display: 'block' }}>🏥 {r.hospital} {r.distanceKm ? `• 📍 ${r.distanceKm} km` : ''}</Typography>
                      <Typography sx={{ fontSize: 12.5, mt: 1, color: '#aaa', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }} onClick={e => e.stopPropagation()}>
                        <Button variant="outlined" size="small" onClick={(e) => { e.stopPropagation(); openConfirmAndProceed(r, 'call'); }}
                          sx={{ borderColor: "rgba(255,255,255,0.15)", color: "#ccc", flex: 1, fontSize: '0.68rem', borderRadius: 2, '&:hover': { borderColor: '#fff', color: '#fff' } }}>
                          📞 {t('call')}
                        </Button>
                        <Button variant="contained" size="small" onClick={(e) => { e.stopPropagation(); openConfirmAndProceed(r, 'navigate'); }}
                          sx={{ background: 'linear-gradient(135deg,#ff2b2b,#b60000)', color: '#fff', flex: 1, fontSize: '0.68rem', borderRadius: 2, '&:hover': { background: 'linear-gradient(135deg,#ff4c4c,#cc0000)' } }}>
                          🗺️ {t('navigate')}
                        </Button>
                        <Button variant="contained" size="small" onClick={(e) => { e.stopPropagation(); openConfirmAndProceed(r, 'whatsapp'); }}
                          sx={{ background: 'linear-gradient(135deg,#25d366,#128c3a)', color: '#fff', flex: 1, fontSize: '0.68rem', borderRadius: 2, '&:hover': { background: 'linear-gradient(135deg,#3de87c,#1aad50)' } }}>
                          💬 WhatsApp
                        </Button>
                      </Box>
                    </Card>

                  ))}
                </Box>
              )}
            </Box>

            {/* Column 3: all other requested blood groups */}
            <Box sx={{
              width: { xs: '100%', md: 340 },
              background: "rgba(255,255,255,0.015)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.04)",
              p: 2.5,
              borderRadius: 4
            }}>
              <Typography sx={{ fontWeight: 700, color: "#ccc", mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: "0.95rem" }}>
                <Box sx={{ width: 24, height: 24, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 12 }}>3</Box>
                {t('allRequestedBloodGroups')}
              </Typography>
              {loadingRequests ? (
                <Box sx={{ textAlign: "center", py: 3 }}><CircularProgress size={24} sx={{ color: "#444" }} /></Box>
              ) : allRequests.length === 0 ? (
                <Box sx={{ p: 2, textAlign: "center", background: "rgba(0,0,0,0.1)", borderRadius: 2 }}>
                  <Typography sx={{ color: "#666", fontSize: '0.85rem' }}>{t('noOtherRequests')}</Typography>
                </Box>
              ) : (
                <Box>
                  {allRequests
                    .map((r) => (
                      <Card key={r._id} onClick={() => setSelectedRequest(r)} sx={{ p: 1.5, mb: 1, background: "rgba(255,255,255,0.01)", border: '1px solid rgba(255,255,255,0.02)', borderRadius: 2, cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: "#bbb" }}>{r.name}</Typography>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: "#777" }}>{r.bloodGroup ?? r.blood}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: "#666", display: 'block', mt: 0.5 }}>{r.hospital} {r.distanceKm ? `• ${r.distanceKm} km` : ''}</Typography>
                      </Card>
                    ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* ACTION BUTTONS */}
          <Box sx={{
            display: "flex", gap: 2, alignItems: "center", flexDirection: { xs: 'column', md: 'row' }, width: '100%',
            p: 3, background: "rgba(255,255,255,0.02)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.05)"
          }}>
            <Button variant="contained" onClick={async () => {
              // sample share availability action
              try {
                let uid = user?.uid || user?._id;

                if (!uid) {
                  try {
                    const me = await fetch(`${API_BASE}/api/user/me`, { credentials: "include", headers: authUtils.getAuthHeaders() });
                    if (me.ok) {
                      const d = await me.json();
                      uid = d.uid || d._id || d.id;
                    }
                  } catch (e) { }
                }

                if (!uid) {
                  alert("Cannot share availability: user UID missing. Please re-login.");
                  return;
                }

                const body = { uid, userId: user?._id, message: "I am available to donate", urgency: false };
                const headers = { "Content-Type": "application/json", ...authUtils.getAuthHeaders() };

                const res = await fetch(`${API_BASE}/api/notify/share-availability`, {
                  method: "POST", headers, credentials: "include", body: JSON.stringify(body),
                });
                if (!res.ok) alert("Failed to share availability");
                else alert("Availability shared successfully.");
              } catch (e) {
                alert("Failed to share availability (network error).");
              }
            }} sx={{
              background: "linear-gradient(135deg, #ff2b2b, #b71c1c)",
              color: "#fff", px: 4, py: 1.5, borderRadius: 2.5, fontWeight: 800, fontSize: '0.9rem',
              boxShadow: "0 8px 24px rgba(255,43,43,0.3)",
              width: { xs: '100%', md: 'auto' },
              '&:hover': { background: "linear-gradient(135deg, #ff4c4c, #cc0000)" }
            }}>
              🚀 SHARE AVAILABILITY
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate("/gamification")}
              sx={{
                borderColor: "rgba(255,215,0,0.5)",
                color: "#ffd700",
                py: 1.5, px: 4, borderRadius: 2.5, fontWeight: 700, fontSize: '0.9rem',
                width: { xs: '100%', md: 'auto' },
                '&:hover': { borderColor: "#ffd700", background: "rgba(255,215,0,0.05)" }
              }}
            >
              🏆 REWARDS & LEADERBOARD
            </Button>
          </Box>

          {/* Request details dialog */}
          {/* Polite phone collection modal shown when server requires donor phone */}
          {/* Phone dialog removed */}

          {/* Polite 'Not now' acknowledgement modal (same look-and-feel as phone modal) */}
          <Dialog open={notNowDialogOpen} onClose={() => setNotNowDialogOpen(false)} fullWidth maxWidth="xs">
            <DialogTitle sx={{ textAlign: 'center' }}>Thank you — we appreciate you</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 1 }}>Thanks for considering to donate — we truly appreciate your willingness to help others.</Typography>
              <Typography variant="body2">If you'd like to help later, you can return to this request from the app and offer your availability. No worries — thank you for your attention.</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setNotNowDialogOpen(false)} autoFocus>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Missing Blood Group Dialog */}
          {/* Missing Blood Group Dialog removed */}

          <RequestDetailsDialog request={selectedRequest} onClose={() => setSelectedRequest(null)} onNavigate={openMapForRequest} onCreateOffer={openConfirmAndProceed} />
        </Box>
      </Box>
    </Box >
  );
}


// Request details dialog at bottom-level to avoid duplicating code
export function RequestDetailsDialog({ request, onClose, onNavigate, onCreateOffer }) {
  const { t } = useTranslation();
  if (!request) return null;
  return (
    <Dialog
      open={Boolean(request)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          background: "linear-gradient(145deg, #1e1e1e, #121212)",
          border: "1px solid rgba(255,43,43,0.3)",
          borderRadius: 4,
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          color: "#fff",
          overflow: "hidden"
        }
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #ff2b2b, #b71c1c)" }} />

      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 3 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: "#ff2b2b", letterSpacing: 0.5 }}>
          {request.hospital || t('requestDetails')}
        </Typography>
        <Chip label={request.urgency === 'high' ? 'URGENT' : request.urgency || 'MEDIUM'} size="small" sx={{
          bgcolor: request.urgency === 'high' ? 'rgba(255,43,43,0.2)' : 'rgba(255,255,255,0.05)',
          color: request.urgency === 'high' ? '#ff4c4c' : '#ccc',
          fontWeight: 800, fontSize: '0.7rem'
        }} />
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 1, mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: "#fff", mb: 0.5 }}>
              {request.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaa", display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocalHospitalIcon sx={{ fontSize: 16, color: "#ff2b2b" }} /> {request.hospital || "Hospital not specified"}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", bgcolor: "rgba(255,43,43,0.1)", p: 1.5, borderRadius: 3, border: "1px solid rgba(255,43,43,0.2)" }}>
            <BloodtypeIcon sx={{ color: "#ff4c4c", fontSize: 24, mb: 0.5 }} />
            <Typography sx={{ fontWeight: 900, color: "#ff2b2b", fontSize: "1.1rem", lineHeight: 1 }}>
              {request.bloodGroup ?? request.blood}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", my: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {request.description && (
            <Box sx={{ p: 2, bgcolor: "rgba(255,255,255,0.02)", borderRadius: 2, borderLeft: "3px solid #666" }}>
              <Typography variant="body2" sx={{ color: "#ddd", fontStyle: "italic" }}>
                "{request.description}"
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "#777", textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{t('phone') || "Phone"}</Typography>
              <Typography sx={{ fontWeight: 600, color: "#fff" }}>{request.phone || "Hidden"}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#777", textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{t('units') || "Units Required"}</Typography>
              <Typography sx={{ fontWeight: 600, color: "#fff" }}>{request.units || '1'} Unit(s)</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#777", textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{t('postedOn') || "Posted On"}</Typography>
              <Typography sx={{ fontWeight: 600, color: "#fff" }}>{request.createdAt ? new Date(request.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}</Typography>
            </Box>
            {request.distanceKm && (
              <Box>
                <Typography variant="caption" sx={{ color: "#777", textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Distance</Typography>
                <Typography sx={{ fontWeight: 600, color: "#ff4c4c" }}>{request.distanceKm} km</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <Box sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="caption" sx={{ textAlign: 'center', color: '#888', mb: 0.5 }}>How would you like to help?</Typography>

        <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            onClick={async () => {
              if (request && request.phone && onCreateOffer) {
                onCreateOffer(request, 'call');
                onClose(); // Automatically close popup
              }
            }}
            variant="outlined"
            sx={{
              flex: 1, minHeight: 48, borderRadius: 2,
              borderColor: "rgba(255,255,255,0.15)", color: "#fff",
              '&:hover': { background: "rgba(255,255,255,0.05)", borderColor: "#fff" }
            }}
          >
            📞 {t('call')?.toUpperCase() || 'CALL'}
          </Button>

          <Button
            onClick={async () => {
              if (request && request.phone && onCreateOffer) {
                onCreateOffer(request, 'whatsapp');
                onClose(); // Automatically close popup
              }
            }}
            variant="contained"
            sx={{
              flex: 1, minHeight: 48, borderRadius: 2,
              background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff",
              boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
              '&:hover': { background: "linear-gradient(135deg, #1ebd5b, #0e7065)" }
            }}
          >
            💬 WHATSAPP
          </Button>

          <Button
            onClick={async () => {
              if (onCreateOffer && request) {
                onCreateOffer(request, 'navigate');
                onClose(); // Automatically close popup
              }
            }}
            variant="contained"
            sx={{
              flex: 1, minHeight: 48, borderRadius: 2,
              background: "linear-gradient(135deg, #ff2b2b, #b71c1c)", color: "#fff",
              boxShadow: "0 4px 12px rgba(255,43,43,0.3)",
              '&:hover': { background: "linear-gradient(135deg, #ff4c4c, #cc0000)" }
            }}
          >
            📍 {t('navigate')?.toUpperCase() || 'NAVIGATE'}
          </Button>
        </Box>

        <Button onClick={onClose} sx={{ mt: 1, color: "#666", '&:hover': { color: "#fff" } }}>
          {t('close')?.toUpperCase() || 'CANCEL'}
        </Button>
      </Box>
    </Dialog>
  );
}

