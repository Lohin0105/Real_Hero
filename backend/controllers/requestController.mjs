import Request from "../models/Request.mjs";
import Notification from "../models/Notification.mjs";
import User from "../models/User.mjs";
import DonorResponse from "../models/DonorResponse.mjs";
import RewardLog from "../models/RewardLog.mjs";
import { sendMail } from "../utils/emailNotifier.mjs";
import { classifySeverity } from "../utils/severityClassifier.mjs";
import { updateReliability } from "../utils/reliabilityManager.mjs";
import { detectFraud } from "../utils/fraudDetector.mjs";
import { getTranslation } from "../utils/translationManager.mjs"; // Added translation support
import * as pushNotifs from "./pushNotificationController.mjs";

/**
 * POST /api/requests/create
 * body: { uid?, name, age, phone, bloodGroup, units, hospital, description, location? }
 */
export const createRequest = async (req, res) => {
  try {
    let { name, age, phone, bloodGroup, units, hospital, description, location } = req.body;
    let uid = req.user?.uid;
    let requesterId = req.user?._id;

    if (!requesterId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // AI INTELLIGENCE: Fraud Detection
    const fraud = await detectFraud(requesterId, 'request');
    if (fraud.isFraud) {
      return res.status(403).json({ error: "Action Blocked", reason: fraud.reason });
    }

    const payload = {
      uid,
      requesterId, // Set the requesterId
      name,
      age,
      phone,
      bloodGroup,
      units: Number(units || 1),
      urgency: req.body.urgency || "normal",
      hospital,
      description
    };

    // AI INTELLIGENCE: Auto-classify severity
    console.log('AI Severity Classifier analyzing request description...');
    const aiUrgency = await classifySeverity(hospital, description);
    if (aiUrgency === 'high' && payload.urgency !== 'high') {
      console.log(`AI Override: Urgency escalated to HIGH based on description: "${description}"`);
      payload.urgency = 'high';
    }

    if (location && typeof location.lat === "number" && typeof location.lng === "number") {
      payload.location = { lat: location.lat, lng: location.lng };
      payload.locationGeo = { type: "Point", coordinates: [location.lng, location.lat] };
    } else if (!location && hospital) {
      // Best-effort: geocode provided hospital/address text to attach coordinates.
      // Use Nominatim (OpenStreetMap) as a simple free geocoder. Keep this non-blocking
      // and fail gracefully if the geocode call fails or returns no result.
      try {
        const apiKey = process.env.GEOAPIFY_API_KEY || process.env.REACT_APP_GEOAPIFY_API_KEY; // Attempt either
        let url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(hospital)}&limit=1`;
        
        if (apiKey) {
           url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(hospital)}&limit=1&apiKey=${apiKey}`;
        }

        const fetchFn = (typeof fetch === 'function') ? fetch : null;
        let geocodeRes = null;
        if (fetchFn) {
          geocodeRes = await fetchFn(url, { headers: { 'User-Agent': 'Real-Hero-Backend' } });
        } else {
          try {
            const { fetch: undiciFetch } = await import('undici');
            geocodeRes = await undiciFetch(url, { headers: { 'User-Agent': 'Real-Hero-Backend' } });
          } catch (e) {
            geocodeRes = null;
          }
        }

        if (geocodeRes && geocodeRes.ok) {
          const data = await geocodeRes.json().catch(() => null);
          if (apiKey && data && data.features && data.features.length > 0) {
            const latN = parseFloat(data.features[0].properties.lat);
            const lonN = parseFloat(data.features[0].properties.lon);
            if (!Number.isNaN(latN) && !Number.isNaN(lonN)) {
              payload.location = { lat: latN, lng: lonN };
              payload.locationGeo = { type: 'Point', coordinates: [lonN, latN] };
            }
          } else if (!apiKey && Array.isArray(data) && data.length > 0) {
            const first = data[0];
            const latN = parseFloat(first.lat);
            const lonN = parseFloat(first.lon);
            if (!Number.isNaN(latN) && !Number.isNaN(lonN)) {
              payload.location = { lat: latN, lng: lonN };
              payload.locationGeo = { type: 'Point', coordinates: [lonN, latN] };
            }
          }
        }
      } catch (e) {
        console.warn('createRequest: geocode failed for hospital', hospital, e?.message || e);
      }
    }

    const reqDoc = await Request.create(payload);

    // Notification Logic: Find users within 50km of requester's live location and notify ALL of them
    try {
      const [lng, lat] = payload.locationGeo?.coordinates || [];
      const hasGeo = typeof lng === 'number' && typeof lat === 'number';
      const radiusInMeters = 50000; // 50 km
      const radiusInRadians = radiusInMeters / 6378137;

      // Exclude requester by both uid and _id
      const excludeFilter = {
        $nor: [
          { uid: uid },
          { _id: requesterId }
        ]
      };

      let usersToNotify = [];

      // --- PASS 1: Geo-based search (users who have saved their location) ---
      if (hasGeo) {
        console.log(`createRequest: PASS 1 â€” geo search near [${lng}, ${lat}] within ${radiusInMeters / 1000}km`);
        const geoUsers = await User.find({
          ...excludeFilter,
          locationGeo: {
            $geoWithin: {
              $centerSphere: [[lng, lat], radiusInRadians]
            }
          }
        }).select("_id name email preferredLanguage").lean();

        console.log(`createRequest: PASS 1 found ${geoUsers.length} users with saved location within radius`);
        usersToNotify = geoUsers;
      }

      // --- PASS 2: Fallback â€” notify ALL users in DB if geo found nobody ---
      // This handles the common case where users haven't saved their location yet
      if (usersToNotify.length === 0) {
        console.log(`createRequest: PASS 2 â€” geo found 0 users, falling back to ALL registered users`);
        const allUsers = await User.find({
          ...excludeFilter,
          email: { $exists: true, $ne: "" }
        }).select("_id name email preferredLanguage").lean();

        console.log(`createRequest: PASS 2 found ${allUsers.length} total users to notify`);
        usersToNotify = allUsers;
      }

      if (usersToNotify.length > 0) {
        // Create in-app notifications for ALL matched users
        const notifications = usersToNotify.map((u) => ({
          userId: u._id,
          title: "🩸 Urgent: Blood Donor Needed",
          body: `${name} needs ${bloodGroup} blood at ${hospital}. Can you help?`,
          meta: { requestId: reqDoc._id, bloodGroup, urgency: payload.urgency || 'normal' },
          createdAt: new Date(),
        }));

        await Notification.insertMany(notifications);
        console.log(`createRequest: Created ${notifications.length} in-app notifications.`);

        // Send Emails to all matched users (fire-and-forget, non-blocking)
        (async () => {
          let sentCount = 0;
          for (const u of usersToNotify) {
            if (!u.email) continue;

            const lang = u.preferredLanguage || 'en';
            const subject = getTranslation(lang, 'reqSubjectNearby', { bloodGroup });
            const bodyNeeded = getTranslation(lang, 'reqBodyNeeded');
            const bodyUserNeeds = getTranslation(lang, 'reqUserNeeds', { requester: name });
            const detailsLabel = getTranslation(lang, 'reqDetails');
            const lBloodGroup = getTranslation(lang, 'reqBloodGroup', { bloodGroup });
            const lHospital = getTranslation(lang, 'reqHospital', { hospital });
            const lUnits = getTranslation(lang, 'reqUnits', { units });
            const lPhone = getTranslation(lang, 'reqPhone', { phone });
            const openApp = getTranslation(lang, 'reqOpenApp');
            const thanks = getTranslation(lang, 'thanks');

            const emailHtml = `
              <p>${getTranslation(lang, 'greeting', { name: u.name || "Donor" })}</p>
              <p><b>${bodyNeeded}</b></p>
              <p>${bodyUserNeeds}</p>
              <p>${detailsLabel}</p>
              <ul>
                <li>${lBloodGroup}</li>
                <li>${lHospital}</li>
                <li>${lUnits}</li>
                <li>${lPhone}</li>
              </ul>
              <p>${openApp}</p>
              <p>${thanks}</p>
            `;

            const emailRes = await sendMail({
              to: u.email,
              subject,
              html: emailHtml,
            });

            if (emailRes.ok) sentCount++;
            else console.warn(`createRequest: Failed to send email to ${u.email}:`, emailRes.error);
          }
          console.log(`createRequest: Sent emails to ${sentCount}/${usersToNotify.length} users.`);
        })();

      } else {
        console.log("createRequest: No users found to notify (DB may be empty).");
      }
    } catch (notifErr) {
      console.error("createRequest: notification error", notifErr);
      // Don't fail the request creation if notifications fail
    }

    // NEW: Push Notifications
    try {
      pushNotifs.notifyMatchingDonors(reqDoc).catch(e => console.error("Push notify error:", e));
    } catch (pushErr) {
      console.error("Push trigger error:", pushErr);
    }

    return res.json({ ok: true, requestId: reqDoc._id, request: reqDoc });
  } catch (err) {
    console.error("createRequest:", err);
    return res.status(500).json({ error: "Failed to create request" });
  }
};

/**
 * GET /api/requests/recent?limit=6&lat=&lng=&maxDistance=20000
 * returns open requests ordered by proximity or recency
 */
export const getRecentRequests = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);
    const donorLat = parseFloat(req.query.lat);
    const donorLng = parseFloat(req.query.lng);
    const { urgency, hospital, sortBy } = req.query;
    // Note: bloodGroup filter intentionally NOT applied server-side —
    // frontend needs ALL blood groups to fill all 3 boxes correctly.

    // Base filter: only show live requests
    const query = { status: { $in: ['open', 'primary_assigned', 'backup_assigned'] } };
    if (urgency && urgency !== 'all') query.urgency = urgency;
    if (hospital) query.hospital = { $regex: hospital, $options: 'i' };

    // Haversine distance in km (used in JS fallback path)
    function haversineKm(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const toRad = d => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const hasDonorCoords = !Number.isNaN(donorLat) && !Number.isNaN(donorLng);

    // ── PATH A: Donor location known → use $geoNear to get distances for ALL requests ──
    if (hasDonorCoords) {
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [donorLng, donorLat] },
            distanceField: 'dist.calculated',
            query,
            spherical: true,
            // NO maxDistance — we want ALL requests so box 3 gets populated too
          },
        },
        // Sort: nearest first by default, or by recency / urgency
        ...(sortBy === 'recent'
          ? [{ $sort: { createdAt: -1 } }]
          : sortBy === 'urgent'
            ? [
              { $addFields: { _urgencyRank: { $switch: { branches: [{ case: { $eq: ['$urgency', 'critical'] }, then: 4 }, { case: { $eq: ['$urgency', 'high'] }, then: 3 }, { case: { $eq: ['$urgency', 'normal'] }, then: 2 }, { case: { $eq: ['$urgency', 'low'] }, then: 1 }], default: 0 } } } },
              { $sort: { _urgencyRank: -1, 'dist.calculated': 1 } },
            ]
            : [{ $sort: { 'dist.calculated': 1 } }]),
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'requesterId',
            foreignField: '_id',
            as: 'reqUser'
          }
        },
        {
          $project: {
            name: 1, phone: 1, bloodGroup: 1, units: 1, hospital: 1,
            description: 1, urgency: 1, createdAt: 1, status: 1,
            location: 1, locationGeo: 1,
            requesterId: 1, uid: 1,
            distanceMeters: '$dist.calculated',
            preferredLanguage: { $arrayElemAt: ['$reqUser.preferredLanguage', 0] }
          },
        },
      ];

      const docs = await Request.aggregate(pipeline);
      return res.json(docs.map(d => ({
        _id: d._id,
        name: d.name, phone: d.phone, bloodGroup: d.bloodGroup, units: d.units,
        hospital: d.hospital, description: d.description,
        urgency: d.urgency || 'medium', createdAt: d.createdAt, status: d.status,
        location: d.location || null, locationGeo: d.locationGeo || null,
        requesterId: d.requesterId || null, uid: d.uid || null,
        preferredLanguage: d.preferredLanguage || 'en',
        // distanceKm is what the frontend uses to classify into box 1/2/3
        distanceKm: d.distanceMeters != null ? (d.distanceMeters / 1000).toFixed(1) : null,
      })));
    }

    // ── PATH B: No donor location → fetch all requests, compute distance where possible ──
    let sortObj = { createdAt: -1 };
    if (sortBy === 'urgent') sortObj = { urgency: -1, createdAt: -1 };

    const docs = await Request.find(query).populate('requesterId', 'preferredLanguage').sort(sortObj).limit(limit).lean();

    return res.json(docs.map(d => {
      // Compute distance if the request has coordinates stored
      let distanceKm = null;
      const reqLat = d.location?.lat ?? d.locationGeo?.coordinates?.[1];
      const reqLng = d.location?.lng ?? d.locationGeo?.coordinates?.[0];
      if (reqLat != null && reqLng != null && hasDonorCoords) {
        distanceKm = haversineKm(donorLat, donorLng, reqLat, reqLng).toFixed(1);
      }

      return {
        _id: d._id,
        name: d.name, phone: d.phone, bloodGroup: d.bloodGroup, units: d.units,
        hospital: d.hospital, description: d.description,
        urgency: d.urgency || 'medium', createdAt: d.createdAt, status: d.status,
        location: d.location || null, locationGeo: d.locationGeo || null,
        requesterId: d.requesterId?._id || d.requesterId || null, uid: d.uid || null,
        preferredLanguage: d.requesterId?.preferredLanguage || 'en',
        distanceKm,  // null if neither donor nor request has coordinates
      };
    }));

  } catch (err) {
    console.error('getRecentRequests:', err);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

/**
 * POST /api/requests/geocode-missing
 * Admin endpoint (protected by GEOCODER_SECRET env) to geocode missing request locations
 * body/query: { limit?: number }
 */
export const geocodeMissingRequests = async (req, res) => {
  try {
    const secret = process.env.GEOCODER_SECRET || null;
    const provided = req.headers['x-geocode-secret'] || req.query.secret || req.body?.secret || null;
    if (!secret || !provided || String(provided) !== String(secret)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const limit = Number(req.query.limit || req.body?.limit || 50);
    // find open requests missing locationGeo
    const docs = await Request.find({ status: 'open', $or: [{ locationGeo: { $exists: false } }, { locationGeo: null }] }).limit(limit).lean();
    if (!docs || docs.length === 0) return res.json({ ok: true, processed: 0 });

    const results = [];
    for (const d of docs) {
      if (!d.hospital) {
        results.push({ id: d._id, ok: false, reason: 'no hospital text' });
        continue;
      }
      try {
        const q = encodeURIComponent(d.hospital);
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&limit=1`;
        let fetchFn = (typeof fetch === 'function') ? fetch : null;
        let r = null;
        if (fetchFn) {
          r = await fetchFn(url, { headers: { 'User-Agent': 'Real-Hero-Backend' } });
        } else {
          try {
            const { fetch: undiciFetch } = await import('undici');
            r = await undiciFetch(url, { headers: { 'User-Agent': 'Real-Hero-Backend' } });
          } catch (e) {
            r = null;
          }
        }
        if (!r || !r.ok) {
          results.push({ id: d._id, ok: false, reason: 'geocode failed' });
        } else {
          const hits = await r.json().catch(() => null);
          if (!Array.isArray(hits) || hits.length === 0) {
            results.push({ id: d._id, ok: false, reason: 'no hits' });
          } else {
            const first = hits[0];
            const lat = parseFloat(first.lat);
            const lon = parseFloat(first.lon);
            if (Number.isNaN(lat) || Number.isNaN(lon)) {
              results.push({ id: d._id, ok: false, reason: 'invalid coords' });
            } else {
              // persist back to DB
              await Request.updateOne({ _id: d._id }, { $set: { location: { lat, lng: lon }, locationGeo: { type: 'Point', coordinates: [lon, lat] } } });
              results.push({ id: d._id, ok: true, lat, lon });
            }
          }
        }
      } catch (e) {
        results.push({ id: d._id, ok: false, reason: e?.message || e });
      }
      // polite delay
      await new Promise((r) => setTimeout(r, 1200));
    }

    return res.json({ ok: true, processed: results.length, results });
  } catch (err) {
    console.error('geocodeMissingRequests:', err);
    return res.status(500).json({ error: err.message || 'geocode failure' });
  }
};

/**
 * POST /api/requests/claim/:id
 * Body: { uid, location? }
 */
export const claimRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) return res.status(401).json({ error: "User not identified" });

    // AI INTELLIGENCE: Fraud Detection
    const fraud = await detectFraud(user._id, 'claim');
    if (fraud.isFraud) {
      return res.status(403).json({ error: "Action Blocked", reason: fraud.reason });
    }
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      return res.status(400).json({ error: "Request is already closed" });
    }

    // Check if already claimed by this user
    const existingResponse = await DonorResponse.findOne({ requestId: id, donorId: user._id });
    if (existingResponse) {
      return res.status(400).json({ error: "You have already claimed/responded to this request" });
    }

    // Prevent self-donation
    if (request.requesterId && user._id && request.requesterId.toString() === user._id.toString()) {
      return res.status(400).json({ error: "You cannot donate to your own request." });
    }

    let role = 'backup';
    let message = "You are a Backup Donor. Standby!";

    if (request.status === 'open' || !request.primaryDonor?.donorId) {
      // Assign Primary
      role = 'primary';
      request.status = 'primary_assigned';
      request.primaryDonor = {
        donorId: user._id,
        name: user.name,
        phone: user.phone,
        bloodGroup: user.bloodGroup || user.blood,
        acceptedAt: new Date(),
        confirmedAt: null,
        arrived: false
      };
      message = "You are the Primary Donor! Please arrive within 2 hours.";
    } else {
      // Assign Backup
      role = 'backup';
      if (request.status === 'primary_assigned') request.status = 'backup_assigned';
      request.backupDonors.push({
        donorId: user._id,
        acceptedAt: new Date(),
        promoted: false,
        reachedHospital: false,
        gpsVerified: false
      });
    }

    await request.save();

    // Create DonorResponse
    await DonorResponse.create({
      requestId: id,
      donorId: user._id,
      role,
      status: 'active',
      hospital: request.hospital // Snapshot hospital name
    });

    // Notify Donor (Email) â€” include requester's contact details + Google Maps navigation link
    if (user.email) {
      const lang = user.preferredLanguage || 'en';
      const subjectKey = role === 'primary' ? 'assignSubjectPrimary' : 'assignSubjectBackup';
      const subject = getTranslation(lang, subjectKey);
      const roleLabel = role === 'primary' ? 'Primary Donor' : 'Backup Donor';

      // Build Google Maps navigation link from request's location
      const reqLat = request.location?.lat || request.locationGeo?.coordinates?.[1];
      const reqLng = request.location?.lng || request.locationGeo?.coordinates?.[0];
      const mapsLink = (reqLat && reqLng)
        ? `https://www.google.com/maps/dir/?api=1&destination=${reqLat},${reqLng}`
        : null;

      const donorEmailHtml = `
        <div>
          <p>Hello <strong>${user.name || 'Donor'}</strong>,</p>
          <p>You have been assigned as <strong>${roleLabel}</strong> for a blood donation request.</p>
          ${role === 'primary'
          ? '<p>Please arrive at the destination within 2 hours.</p>'
          : '<p>You are on standby as a backup donor. Be ready in case the primary donor cannot arrive.</p>'}
          
          <h3>Requester Details</h3>
          <p><strong>Name:</strong> ${request.name || '—'}</p>
          <p><strong>Blood Group:</strong> ${request.bloodGroup || '—'}</p>
          <p><strong>Phone:</strong> <a href="tel:${request.phone || ''}">${request.phone || '—'}</a></p>
          <p><strong>Hospital / Location:</strong> ${request.hospital || '—'}</p>
          
          ${mapsLink ? `
            <p>
              <a href="${mapsLink}" target="_blank">Navigate to Requester Location</a>
            </p>
          ` : ''}
          <p>Thank you for being a Real Hero!</p>
        </div>
      `;

      sendMail({ to: user.email, subject, html: donorEmailHtml }).catch(console.error);
    }

    // Notify Requester — include donor's contact details + location
    let requester = null;
    if (request.requesterId) {
      requester = await User.findById(request.requesterId);
    }
    if (requester?.email) {
      const lang = requester.preferredLanguage || 'en';
      const subject = getTranslation(lang, 'notifySubjectDonorFound');
      const roleLabel = role === 'primary' ? 'Primary Donor' : 'Backup Donor';

      // Donor location map link
      const donorLat = user.location?.lat || user.locationGeo?.coordinates?.[1];
      const donorLng = user.location?.lng || user.locationGeo?.coordinates?.[0];
      const donorMapsLink = (donorLat && donorLng)
        ? `https://www.google.com/maps/search/?api=1&query=${donorLat},${donorLng}`
        : null;

      const requesterEmailHtml = `
        <div>
          <p>Hello <strong>${requester.name || 'Requester'}</strong>,</p>
          <p>Great news! A <strong>${roleLabel}</strong> has accepted your blood request.</p>
          
          <h3>Donor Details</h3>
          <p><strong>Name:</strong> ${user.name || '—'}</p>
          <p><strong>Blood Group:</strong> ${user.bloodGroup || user.blood || '—'}</p>
          <p><strong>Phone:</strong> <a href="tel:${user.phone || ''}">${user.phone || '—'}</a></p>
          <p><strong>Email:</strong> <a href="mailto:${user.email}">${user.email}</a></p>
          <p><strong>Role:</strong> ${roleLabel}</p>

          ${donorMapsLink ? `
            <p>
              <a href="${donorMapsLink}" target="_blank">View Donor Location</a>
            </p>
          ` : ''}
          <p>Please coordinate with the donor and be ready at the hospital. Thank you!</p>
        </div>
      `;

      sendMail({
        to: requester.email,
        subject,
        html: requesterEmailHtml
      }).catch(console.error);
    }

    return res.json({ ok: true, role, message });

  } catch (err) {
    console.error("claimRequest:", err);
    return res.status(500).json({ error: "Failed to claim request: " + err.message });
  }
};

/**
 * POST /api/requests/interest/:id
 * Triggered when donor clicks "Call" or "Navigate".
 * ──── EMAIL 1 ───────────────────────────────────
 * Sends pledge confirmation email to DONOR with YES / NO buttons.
 */
export const registerInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) return res.status(401).json({ error: "Not authenticated" });

    console.log(`[EMAIL-1] Pledge request: donor=${user.email} request=${id}`);

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      return res.status(400).json({ error: "This request is already closed." });
    }

    if (request.requesterId && request.requesterId.toString() === user._id.toString()) {
      return res.status(400).json({ error: "You cannot donate to your own request." });
    }

    if (!user.email) {
      console.warn(`[EMAIL-1] Donor ${user._id} has no email â€” skipping`);
      return res.status(400).json({ error: "Your account has no email address. Cannot send pledge." });
    }

    const serverBase = process.env.SERVER_BASE || `http://localhost:${process.env.PORT || 5001}`;
    const yesUrl = `${serverBase}/api/requests/confirm-interest/${id}?uid=${user.uid}&response=yes`;
    const noUrl = `${serverBase}/api/requests/confirm-interest/${id}?uid=${user.uid}&response=no`;

    const lang = user.preferredLanguage || 'en';
    const subject = getTranslation(lang, 'emailSubject');

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <p>Hello <strong>${user.name || 'Donor'}</strong>,</p>
        <p>You showed interest in donating blood for a request at <strong>${request.hospital || 'the hospital'}</strong>.</p>
        <p><strong>Do you confirm that you want to donate?</strong></p>
        <p>Blood Group Needed: <strong>${request.bloodGroup || '—'}</strong> | Units: <strong>${request.units || 1}</strong></p>

        <p>
          <a href="${yesUrl}">YES — I will donate</a><br/><br/>
          <a href="${noUrl}">NO — I cannot</a>
        </p>

        <p>If you confirm YES, you will be assigned as a donor and the requester will be notified.</p>
        <p>Thanks for being a Real Hero!</p>
      </div>
    `;

    const result = await sendMail({ to: user.email, subject, html });
    console.log(`[EMAIL-1] Sent to ${user.email}: ok=${result?.ok} id=${result?.info?.messageId || result?.error}`);

    return res.json({ ok: true, message: "Pledge email sent. Please check your inbox." });

  } catch (err) {
    console.error("[EMAIL-1] registerInterest error:", err);
    return res.status(500).json({ error: "Failed to send pledge email: " + err.message });
  }
};

/**
 * GET /api/requests/confirm-interest/:id?uid=...&response=yes|no
 * Called when donor clicks YES or NO in the pledge email.
 * â”€â”€â”€ EMAIL 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * If YES: assigns donor, then sends:
 *   â€¢ EMAIL 2 â†’ Donor: assignment confirmation + requester details + maps link
 *   â€¢ EMAIL 3 â†’ Requester: donor has been assigned + donor details + maps link
 */
export const confirmInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, response } = req.query;

    // â”€â”€â”€â”€ NO branch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (response !== 'yes') {
      return res.send(`
        <html lang="en"><body>
          <h2>Pledge Declined</h2>
          <p>Thank you for letting us know. You have not been assigned to this request.</p>
          <p>You can close this window.</p>
        </body></html>
      `);
    }

    // â”€â”€â”€â”€ Resolve donor user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let donor = null;
    if (uid) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(uid);
      donor = isObjectId
        ? await User.findOne({ $or: [{ uid }, { _id: uid }] })
        : await User.findOne({ uid });
    }
    if (!donor) return res.status(404).send("<h2>User not found</h2>");

    // â”€â”€â”€â”€ Load request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const request = await Request.findById(id);
    if (!request) return res.status(404).send("<h2>Request not found</h2>");

    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      return res.send(`<html lang="en"><body>
        <h2>Request Already Closed</h2><p>This blood request has already been fulfilled or cancelled.</p>
      </body></html>`);
    }

    // â”€â”€â”€â”€ Duplicate guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const existing = await DonorResponse.findOne({ requestId: id, donorId: donor._id });
    if (existing) {
      return res.send(`<html lang="en"><body>
        <h2>Already Registered</h2>
        <p>You are already a <strong>${existing.role}</strong> donor for this request.</p>
        <p>Check the app under <em>My Donations</em> for status updates.</p>
      </body></html>`);
    }

    // â”€â”€â”€â”€ Assign donor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let role = 'backup';
    let roleLabel = 'Backup Donor';
    let message = "You are a Backup Donor. Standby!";

    if (request.status === 'open' || !request.primaryDonor?.donorId) {
      role = 'primary';
      roleLabel = 'Primary Donor';
      message = "You are the Primary Donor! Please arrive within 2 hours.";
      request.status = 'primary_assigned';
      request.primaryDonor = { donorId: donor._id, acceptedAt: new Date(), confirmedAt: null, arrived: false };
    } else {
      if (request.status === 'primary_assigned') request.status = 'backup_assigned';
      request.backupDonors = request.backupDonors || [];
      request.backupDonors.push({ donorId: donor._id, acceptedAt: new Date(), promoted: false, reachedHospital: false, gpsVerified: false });
    }

    await request.save();
    await updateReliability(donor._id, 'accept').catch(() => { });
    await DonorResponse.create({ requestId: id, donorId: donor._id, role, status: 'active', hospital: request.hospital });

    console.log(`[ASSIGN] donor=${donor.email} â†’ role=${role} request=${id}`);

    // â”€â”€â”€â”€ EMAIL 2: Donor Assignment Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Contains: role, requester contact details, Google Maps navigation link
    const reqLat = request.location?.lat ?? request.locationGeo?.coordinates?.[1];
    const reqLng = request.location?.lng ?? request.locationGeo?.coordinates?.[0];
    const mapsNavLink = (reqLat && reqLng)
      ? `https://www.google.com/maps/dir/?api=1&destination=${reqLat},${reqLng}`
      : null;

    const donorSubject = role === 'primary'
      ? 'Real-Hero: You are the Primary Donor!'
      : 'Real-Hero: You are a Backup Donor';

    const donorHtml = `
      <div>
        <p>Hello <strong>${donor.name || 'Donor'}</strong>,</p>
        <p>Thank you for confirming your pledge! You have been assigned as <strong>${roleLabel}</strong>.</p>

        ${role === 'primary'
        ? `<p>Please arrive at the hospital within 2 hours.</p>`
        : `<p>You are on standby. If the primary donor cannot make it, you will be promoted immediately.</p>`}
        
        <h3>Requester / Patient Details</h3>
        <p><strong>Patient Name:</strong> ${request.name || '—'}</p>
        <p><strong>Blood Group Needed:</strong> ${request.bloodGroup || '—'}</p>
        <p><strong>Units Needed:</strong> ${request.units || 1}</p>
        <p><strong>Contact Phone:</strong> <a href="tel:${request.phone || ''}">${request.phone || '—'}</a></p>
        <p><strong>Hospital / Location:</strong> ${request.hospital || '—'}</p>
        
        ${mapsNavLink ? `<p><a href="${mapsNavLink}" target="_blank">Navigate to Hospital</a></p>` : ''}

        <p>Once you arrive and donate, mark it as complete in the app so the requester gets notified.</p>
        <p>Thank you for saving a life! — Real-Hero Team</p>
      </div>
    `;

    try {
      const r2 = await sendMail({ to: donor.email, subject: donorSubject, html: donorHtml });
      console.log(`[EMAIL-2] Donor assignment email to ${donor.email}: ok=${r2?.ok} id=${r2?.info?.messageId}`);
    } catch (e) {
      console.error('[EMAIL-2] Failed to send donor assignment email:', e?.message || e);
    }

    // â”€â”€â”€â”€ EMAIL 3: Requester Notification Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Lookup requester: prefer requesterId, fall back to request.uid field
    let requester = null;
    if (request.requesterId) {
      requester = await User.findById(request.requesterId).catch(() => null);
    }
    if (!requester && request.uid) {
      requester = await User.findOne({ uid: request.uid }).catch(() => null);
    }

    if (requester?.email) {
      const donorLat = donor.location?.lat ?? donor.locationGeo?.coordinates?.[1];
      const donorLng = donor.location?.lng ?? donor.locationGeo?.coordinates?.[0];
      const donorMapsLink = (donorLat && donorLng)
        ? `https://www.google.com/maps/search/?api=1&query=${donorLat},${donorLng}`
        : null;

      const reqSubject = role === 'primary'
        ? 'Real-Hero: A Primary Donor Has Been Assigned!'
        : 'Real-Hero: A Backup Donor Has Been Assigned';

      const requesterHtml = `
        <div style="font-family: Arial, sans-serif;">
          <p>Hello <strong>${requester.name || 'Requester'}</strong>,</p>
          <p>Great news! A <strong>${roleLabel}</strong> has confirmed they will donate blood for your request at <strong>${request.hospital || 'the hospital'}</strong>.</p>

          <hr/>
          <h3>Donor Details</h3>
          <p>
            <strong>Name:</strong> ${donor.name || '—'}<br/>
            <strong>Blood Group:</strong> ${donor.bloodGroup || donor.blood || '—'}<br/>
            <strong>Phone:</strong> <a href="tel:${donor.phone || ''}">${donor.phone || '—'}</a><br/>
            <strong>Email:</strong> <a href="mailto:${donor.email}">${donor.email}</a><br/>
            <strong>Role:</strong> ${roleLabel}
          </p>

          ${donorMapsLink ? `
          <p>
            <a href="${donorMapsLink}" target="_blank">View Donor's Location</a>
          </p>
          ` : ''}

          <p>Please coordinate with the donor and be ready at the hospital. Thank you!</p>
        </div>
      `;

      try {
        const r3 = await sendMail({ to: requester.email, subject: reqSubject, html: requesterHtml });
        console.log(`[EMAIL-3] Requester notification to ${requester.email}: ok=${r3?.ok} id=${r3?.info?.messageId}`);
      } catch (e) {
        console.error('[EMAIL-3] Failed to send requester notification:', e?.message || e);
      }
    } else {
      console.warn(`[EMAIL-3] No requester email found for request ${id}. requesterId=${request.requesterId} uid=${request.uid}`);
    }


    return res.send(`
      <html lang="en"><body>
        <div>
          <h2>Thank You!</h2>
          <p>${message}</p>
          <p>You will receive a confirmation email with the patient's details.</p>
          <p>You can track this donation in the app under <em>My Donations</em>.</p>
        </div>
      </body></html>
    `);

  } catch (err) {
    console.error("[confirmInterest] error:", err);
    return res.status(500).send("<h2>Internal Server Error: " + err.message + "</h2>");
  }
};

/**
 * POST /api/requests/verify-arrival/:id
 * Body: { uid, lat, lng }
 */
export const verifyArrival = async (req, res) => {
  // Placeholder for GPS verification
  return res.json({ ok: true, message: "Arrival verified (mock)" });
};

/**
 * POST /api/requests/complete/:id
 * Body: { uid }
 */
export const completeDonation = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = req.user;
    if (!donor) return res.status(401).json({ error: "Donor not found from authentication token" });

    const request = await Request.findById(id).populate('requesterId');
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Don't change status - keep it as is (primary_assigned or backup_assigned)
    // Just send verification email to requester
    await request.save();

    // Update DonorResponse status to 'completed' so it shows in history
    await DonorResponse.findOneAndUpdate(
      { requestId: id, donorId: donor._id },
      { status: 'completed' }
    );

    // Send verification email to requester
    let requester = request.requesterId;

    // Fallback: if requesterId is missing (legacy), try to find user by uid
    if (!requester && request.uid) {
      requester = await User.findOne({ uid: request.uid });
    }

    console.log('Requester info:', {
      hasRequester: !!requester,
      requesterEmail: requester?.email,
      requesterName: requester?.name
    });

    if (requester?.email) {
      const lang = requester.preferredLanguage || 'en';
      const verifyYesUrl = `${process.env.SERVER_BASE || 'http://localhost:5000'}/api/requests/verify-donation/${id}?response=yes`;
      const verifyNoUrl = `${process.env.SERVER_BASE || 'http://localhost:5000'}/api/requests/verify-donation/${id}?response=no`;

      const subject = getTranslation(lang, 'notifySubjectVerify');
      const greeting = getTranslation(lang, 'greeting', { name: requester.name || 'User' });
      const bodyReq = getTranslation(lang, 'notifyBodyVerifyReq');
      const bodyAction = getTranslation(lang, 'notifyBodyVerifyAction', { donor: donor.name || 'A donor', hospital: request.hospital });
      const verifyQ = getTranslation(lang, 'notifyVerifyQ');
      const verifyConfirm = getTranslation(lang, 'notifyVerifyConfirm');
      const btnYes = getTranslation(lang, 'notifyBtnYesDonated');
      const btnNo = getTranslation(lang, 'notifyBtnNoDonated');
      const verifyTrust = getTranslation(lang, 'notifyVerifyTrust');
      const thanks = getTranslation(lang, 'thanks');

      const emailHtml = `
        <p>${greeting}</p>
        <p><b>${bodyReq}</b></p>
        <p>${bodyAction}</p>
        <p><b>${verifyQ}</b></p>
        <p>${verifyConfirm}</p>
        <p>
          <a href="${verifyYesUrl}">${btnYes}</a> | <a href="${verifyNoUrl}">${btnNo}</a>
        </p>
        <p>${verifyTrust}</p>
        <p>${thanks}</p>
      `;

      console.log('Sending verification email to:', requester.email);
      await sendMail({
        to: requester.email,
        subject: subject,
        html: emailHtml
      });
      console.log('Verification email sent successfully');
    } else {
      console.warn('No requester email found - cannot send verification email');
    }

    return res.json({ ok: true, message: "Verification email sent to requester. Rewards pending confirmation." });
  } catch (e) {
    console.error("completeDonation error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * POST /api/requests/cancel/:id
 * Body: { uid }
 */
export const cancelDonation = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = req.user;
    if (!donor) return res.status(401).json({ error: "Donor not found from authentication token" });

    // Find the request and the donor
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Check if this donor is the primary donor
    const isPrimaryDonor = request.primaryDonor?.donorId?.toString() === donor._id.toString();

    if (isPrimaryDonor) {
      // Primary donor is cancelling - promote first backup
      const backupDonors = request.backupDonors || [];

      if (backupDonors.length > 0) {
        // Promote first backup to primary
        const newPrimary = backupDonors[0];
        request.primaryDonor = {
          donorId: newPrimary.donorId,
          acceptedAt: new Date(),
          confirmedAt: null,
          arrived: false
        };

        // Remove promoted donor from backups
        request.backupDonors = backupDonors.slice(1);

        // Update DonorResponse for promoted donor
        await DonorResponse.findOneAndUpdate(
          { requestId: id, donorId: newPrimary.donorId },
          { role: 'primary', status: 'active' }
        );

        // Update cancelled donor's response
        await DonorResponse.findOneAndUpdate(
          { requestId: id, donorId: donor._id },
          { status: 'cancelled' }
        );

        await request.save();

        // AI INTELLIGENCE: Penalize cancellation
        await updateReliability(donor._id, 'cancel');

        // Send email to newly promoted primary donor
        const newPrimaryUser = await User.findById(newPrimary.donorId);
        if (newPrimaryUser?.email) {
          const lang = newPrimaryUser.preferredLanguage || 'en';
          const subject = getTranslation(lang, 'cancelSubjectPromoted');
          const greeting = getTranslation(lang, 'greeting', { name: newPrimaryUser.name || 'Hero' });
          const body = getTranslation(lang, 'cancelBodyPromoted', { hospital: request.hospital });
          const arrive = getTranslation(lang, 'assignArrive');
          const cancel = getTranslation(lang, 'assignCancelNote');
          const thanks = getTranslation(lang, 'thanks');

          const emailHtml = `
            <p>${greeting}</p>
            <p><b>${subject}</b></p>
            <p>${body}</p>
            <p><b>${arrive}</b></p>
            <p>${cancel}</p>
            <p>${thanks}</p>
          `;

          await sendMail({
            to: newPrimaryUser.email,
            subject: subject,
            html: emailHtml
          });
        }

        // Notify Requester about the change WITH DONOR DETAILS
        const requester = await User.findById(request.requesterId);
        if (requester?.email) {
          const lang = requester.preferredLanguage || 'en';
          const subject = getTranslation(lang, 'cancelSubjectRequesterUpdate');
          const greeting = getTranslation(lang, 'greeting', { name: requester.name });
          const body = getTranslation(lang, 'cancelBodyRequesterUpdate');
          const detailsHeader = getTranslation(lang, 'cancelNewPrimaryDetails');
          const lName = getTranslation(lang, 'labelName');  // reuse from before? or make new basic labels
          const lPhone = getTranslation(lang, 'labelPhone');
          const lBlood = getTranslation(lang, 'labelBlood');
          const lEmail = getTranslation(lang, 'labelEmail');
          const contact = getTranslation(lang, 'cancelContact', { hospital: request.hospital });
          const thanks = getTranslation(lang, 'thanks');

          await sendMail({
            to: requester.email,
            subject: subject,
            html: `
              <p>${greeting}</p>
              <p>${body}</p>
              <h3>${detailsHeader}</h3>
              <ul>
                <li><b>${lName || 'Name'}:</b> ${newPrimaryUser?.name || 'Not provided'}</li>
                <li><b>${lPhone || 'Phone'}:</b> ${newPrimaryUser?.phone || 'Not provided'}</li>
                <li><b>${lBlood || 'Blood Group'}:</b> ${newPrimaryUser?.bloodGroup || 'Not specified'}</li>
                <li><b>${lEmail || 'Email'}:</b> ${newPrimaryUser?.email || 'Not provided'}</li>
              </ul>
              <p>${contact}</p>
              <p>${thanks}</p>
            `
          });
        }

        return res.json({ ok: true, message: "Donation cancelled. Backup donor promoted to primary." });
      } else {
        // No backups available - mark request as open again
        request.primaryDonor = null;
        request.status = 'open';

        // Update cancelled donor's response
        await DonorResponse.findOneAndUpdate(
          { requestId: id, donorId: donor._id },
          { status: 'cancelled' }
        );

        await request.save();

        // AI INTELLIGENCE: Penalize cancellation
        await updateReliability(donor._id, 'cancel');
        return res.json({ ok: true, message: "Donation cancelled. Request is now open for new donors." });
      }
    } else {
      // Backup donor is cancelling - just remove them from backups
      request.backupDonors = request.backupDonors.filter(
        b => b.donorId.toString() !== donor._id.toString()
      );

      // Update cancelled donor's response
      await DonorResponse.findOneAndUpdate(
        { requestId: id, donorId: donor._id },
        { status: 'cancelled' }
      );

      await request.save();
      return res.json({ ok: true, message: "Donation cancelled." });
    }
  } catch (e) {
    console.error("cancelDonation error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * GET /api/requests/my-requests
 */
export const getMyRequests = async (req, res) => {
  try {
    const { bloodGroup, urgency, hospital } = req.query;
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Authentication required" });

    const query = {
      $or: [
        { requesterId: user._id },
        { uid: user.uid }
      ]
    };

    if (bloodGroup && bloodGroup !== 'all') query.bloodGroup = bloodGroup;
    if (urgency && urgency !== 'all') query.urgency = urgency;
    if (hospital) query.hospital = { $regex: hospital, $options: 'i' };

    const requests = await Request.find(query).sort({ createdAt: -1 });

    return res.json(requests);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

/**
 * GET /api/requests/my-donations
 */
export const getMyDonations = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const responses = await DonorResponse.find({ donorId: user._id }).populate('requestId').sort({ updatedAt: -1 });
    return res.json(responses);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

/**
 * POST /api/requests/close/:id
 * Body: { uid }
 */
export const closeRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Mark as fulfilled rather than deleting so it appears in Requester's History
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    request.status = 'fulfilled';
    await request.save();

    // Mark any active donor responses as completed
    await DonorResponse.updateMany(
      { requestId: id, status: 'active' },
      { $set: { status: 'completed' } }
    );

    return res.json({ ok: true, message: "Request marked as fulfilled successfully." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

/**
 * GET /api/requests/verify-donation/:id?response=yes|no
 * Handle requester's verification response from email
 */
export const verifyDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.query; // 'yes' or 'no'

    const request = await Request.findById(id).populate('requesterId');
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (response === 'yes') {
      // Requester confirmed donation - distribute rewards
      request.status = 'fulfilled';
      await request.save();

      // Get primary donor
      const primaryDonor = await User.findById(request.primaryDonor?.donorId);

      // Get requester
      let requester = request.requesterId;

      // Fallback: if requesterId is missing (legacy), try to find user by uid
      if (!requester && request.uid) {
        requester = await User.findOne({ uid: request.uid });
      }

      console.log('verifyDonation - Requester info:', {
        hasRequester: !!requester,
        requesterEmail: requester?.email,
        requesterName: requester?.name
      });

      // Get ALL backup donors (reward for willingness)
      const backupDonorResponses = await DonorResponse.find({
        requestId: id,
        role: 'backup'
      }).populate('donorId');

      // Award rewards
      const rewardLogs = [];

      // Primary Donor: 50 coins + 10 leaderboard points
      if (primaryDonor) {
        primaryDonor.coins = (primaryDonor.coins || 0) + 50;
        primaryDonor.leaderboardPoints = (primaryDonor.leaderboardPoints || 0) + 10;
        primaryDonor.donationsCount = (primaryDonor.donationsCount || 0) + 1;
        primaryDonor.lastDonation = new Date();
        await primaryDonor.save();

        // AI INTELLIGENCE: Reward successful donation completion
        await updateReliability(primaryDonor._id, 'complete');

        // Update DonorResponse with reward points
        await DonorResponse.findOneAndUpdate(
          { requestId: id, donorId: primaryDonor._id },
          { rewardPoints: 10 }
        );

        await RewardLog.create({
          userId: primaryDonor._id,
          requestId: id,
          points: 10,
          coins: 50,
          leaderboardPoints: 10,
          bloodGroup: request.bloodGroup,
          patientName: request.name,
          hospital: request.hospital,
          type: 'donation_completed',
          description: 'Primary donor reward for completing donation'
        });

        // Send success email to donor
        if (primaryDonor.email) {
          const emailHtml = `
            <div>
              <p>Hi ${primaryDonor.name || 'Hero'},</p>
              <p><b>Congratulations!</b></p>
              <p>On background verifications, we have proved that you have donated successfully at <b>${request.hospital}</b>.</p>
              <p><b>You have received your rewards:</b></p>
              <ul>
                <li>50 Coins</li>
                <li>10 Leaderboard Points</li>
              </ul>
              <p>Thank you for being a real hero and saving lives!</p>
              <p>— Real-Hero Team</p>
            </div>
          `;

          await sendMail({
            to: primaryDonor.email,
            subject: "Donation Verified - Rewards Credited!",
            html: emailHtml
          });
        }
      }

      // Requester: 20 coins + 3 leaderboard points
      if (requester) {
        requester.coins = (requester.coins || 0) + 20;
        requester.leaderboardPoints = (requester.leaderboardPoints || 0) + 3;
        await requester.save();

        await RewardLog.create({
          userId: requester._id,
          requestId: id,
          points: 3,
          coins: 20,
          leaderboardPoints: 3,
          patientName: request.name,
          hospital: request.hospital,
          type: 'request_fulfilled',
          description: 'Requester reward for successful blood request'
        });
      }

      // Backup Donors: 10 coins + 2 leaderboard points each
      for (const donorResponse of backupDonorResponses) {
        const backupDonor = donorResponse.donorId;
        if (backupDonor) {
          backupDonor.coins = (backupDonor.coins || 0) + 10;
          backupDonor.leaderboardPoints = (backupDonor.leaderboardPoints || 0) + 2;
          await backupDonor.save();

          // Update DonorResponse with reward points
          await DonorResponse.findOneAndUpdate(
            { _id: donorResponse._id },
            { rewardPoints: 2 }
          );

          await RewardLog.create({
            userId: backupDonor._id,
            requestId: id,
            points: 2,
            coins: 10,
            leaderboardPoints: 2,
            patientName: request.name,
            hospital: request.hospital,
            type: 'backup_arrival',
            description: 'Backup donor reward for willingness to donate'
          });

          // Send email to backup donor
          if (backupDonor.email) {
            const emailHtml = `
              <div>
                <p>Hi ${backupDonor.name || 'Hero'},</p>
                <p><b>Thank You for Your Willingness!</b></p>
                <p>The blood donation request at <b>${request.hospital}</b> has been successfully fulfilled.</p>
                <p>You have received rewards for your willingness to donate:</p>
                <ul>
                  <li>10 Coins</li>
                  <li>2 Leaderboard Points</li>
                </ul>
                <p>Thank you for being ready to save lives!</p>
                <p>— Real-Hero Team</p>
              </div>
            `;
            await sendMail({
              to: backupDonor.email,
              subject: "Thank You for Your Willingness!",
              html: emailHtml
            });
          }
        }
      }

      // Snapshot hospital name to all donor responses before deleting request
      await DonorResponse.updateMany(
        { requestId: id },
        { $set: { hospital: request.hospital } }
      );

      // Keep the request as fulfilled instead of deleting it so it shows in history
      // await Request.findByIdAndDelete(id);
      console.log(`verifyDonation: Request ${id} marked as fulfilled (kept in history).`);

      // Return success page
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Donation Verified</title>
        </head>
        <body>
          <h1>Donation Verified!</h1>
          <p>Thank you for confirming the donation. Rewards have been distributed to all participants.</p>
          <p>The request has been removed from the active list.</p>
          <p>You can close this page now.</p>
        </body>
        </html>
      `);

    } else if (response === 'no') {
      // Requester said donor did NOT donate
      request.status = 'failed';
      await request.save();

      // AI INTELLIGENCE: Penalize no-show
      if (request.primaryDonor?.donorId) {
        await updateReliability(request.primaryDonor.donorId, 'no_show');
      }

      // Get primary donor
      const primaryDonor = await User.findById(request.primaryDonor?.donorId);

      // Send email to donor about verification failure
      if (primaryDonor?.email) {
        const emailHtml = `
          <div>
            <p>Hi ${primaryDonor.name || 'User'},</p>
            <p>We regret to inform you that the requester has indicated that the donation was not completed for the request at <b>${request.hospital}</b>.</p>
            <p>If you believe this is an error, please contact our support team.</p>
            <p>— Real-Hero Team</p>
          </div>
        `;

        await sendMail({
          to: primaryDonor.email,
          subject: "Donation Verification Failed",
          html: emailHtml
        });
      }

      // Return failure page
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Verification Recorded</title>
        </head>
        <body>
          <h1>Verification Recorded</h1>
          <p>Thank you for your feedback. The donation has been marked as not completed.</p>
          <p>You can close this page now.</p>
        </body>
        </html>
      `);
    } else {
      return res.status(400).json({ error: "Invalid response. Use 'yes' or 'no'." });
    }

  } catch (e) {
    console.error("verifyDonation error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/**
 * POST /api/requests/watch/:id
 * Register a donor as a watcher if they are in cooldown.
 */
export const watchRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // from authMiddleware
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Check if already watching
    const alreadyWatching = request.watchers?.some(w => w.donorId.toString() === user._id.toString());

    if (!alreadyWatching) {
      if (!request.watchers) request.watchers = [];
      request.watchers.push({
        donorId: user._id,
        email: user.email,
        name: user.name,
        addedAt: new Date(),
        notified: false
      });
      await request.save();
    }

    return res.json({ ok: true, message: 'Successfully registered to watch request' });
  } catch (err) {
    console.error('watchRequest error:', err);
    return res.status(500).json({ error: 'Failed to watch request' });
  }
};
