// backend/controllers/rewardController.mjs
import User from "../models/User.mjs";
import RewardLog from "../models/RewardLog.mjs";

/**
 * GET /api/rewards/leaderboard
 * Get top 50 users by leaderboard points
 */
export const getLeaderboard = async (req, res) => {
    try {
        const topUsers = await User.find({})
            .sort({ leaderboardPoints: -1 })
            .limit(50)
            .select("name leaderboardPoints coins profilePhoto")
            .lean();

        return res.json(topUsers);
    } catch (e) {
        console.error("getLeaderboard error:", e);
        return res.status(500).json({ error: e.message });
    }
};

/**
 * GET /api/rewards/my-rewards
 * Get user's reward history
 */
export const getMyRewards = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Authentication required" });

        const rewards = await RewardLog.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .lean();

        return res.json(rewards);
    } catch (e) {
        console.error("getMyRewards error:", e);
        return res.status(500).json({ error: e.message });
    }
};
