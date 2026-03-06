import User from "../models/User.mjs";
import Notification from "../models/Notification.mjs";

/** POST /api/donors/availability */
export const updateAvailability = async (req, res) => {
  try {
    const userFromMiddleware = req.user;
    const uid = userFromMiddleware?.uid;
    const { available, location } = req.body;

    if (!uid) return res.status(401).json({ message: "Authentication required" });

    let user = userFromMiddleware;

    // Fallback removed: we strictly expect the user to be in the local DB
    // and correctly identified by the authMiddleware JWT logic.

    if (!user) return res.status(404).json({ message: "User not found" });

    user.available = Boolean(available);
    if (location && typeof location.lat === "number" && typeof location.lng === "number") {
      user.location = { lat: location.lat, lng: location.lng };
      user.locationGeo = { type: "Point", coordinates: [location.lng, location.lat] };
    }
    await user.save();

    // lightweight notification
    try {
      await Notification.create({
        userId: user._id,
        title: "Availability updated",
        body: `${user.name || "Donor"} is now ${user.available ? "available" : "unavailable"}`,
        meta: { available: user.available },
      });
    } catch (e) {
      console.warn("Failed to create notification:", e);
    }

    return res.json({ available: user.available });
  } catch (err) {
    console.error("donors.updateAvailability:", err);
    return res.status(500).json({ error: "Failed to update availability" });
  }
};

/** GET /api/donors/nearby?limit=6&lat=&lng=&maxDistance=20000 */
export const getNearbyDonors = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 6);
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      const maxDistance = Number(req.query.maxDistance || 20000); // meters
      const docs = await User.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "dist.calculated",
            query: { available: true },
            spherical: true,
            maxDistance,
          },
        },
        { $limit: limit },
        {
          $project: {
            name: 1,
            email: 1,
            blood: 1,
            locationGeo: 1,
            distanceMeters: "$dist.calculated",
            heroCoins: 1,
          },
        },
      ]);

      const out = docs.map((d) => ({
        _id: d._id,
        name: d.name,
        bloodGroup: d.blood,
        distanceKm: d.distanceMeters ? (d.distanceMeters / 1000).toFixed(1) : null,
        locationGeo: d.locationGeo,
        heroCoins: d.heroCoins || 0,
      }));

      return res.json(out);
    }

    // fallback when lat/lng missing: return available users
    const donors = await User.find({ available: true }).sort({ updatedAt: -1 }).limit(limit).lean();
    const out = donors.map((d) => ({
      _id: d._id,
      name: d.name,
      bloodGroup: d.blood,
      distanceKm: null,
      location: d.location,
      heroCoins: d.heroCoins || 0,
    }));

    return res.json(out);
  } catch (err) {
    console.error("getNearbyDonors:", err);
    return res.status(500).json({ error: "Failed to fetch nearby donors" });
  }
};
