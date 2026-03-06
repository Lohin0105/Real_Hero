// backend/controllers/gamificationController.mjs
import Gamification from "../models/Gamification.mjs";
import User from "../models/User.mjs";

/** GET /api/gamification/status */
export const getGamificationStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    let g = await Gamification.findOne({ userId: user._id });
    if (!g) {
      g = await Gamification.create({ userId: user._id, heroCoins: user.heroCoins || 0, level: 1, progressPercent: 0 });
    }
    return res.json(g);
  } catch (err) {
    console.error("getGamificationStatus:", err);
    return res.status(500).json({ error: "failed" });
  }
};
