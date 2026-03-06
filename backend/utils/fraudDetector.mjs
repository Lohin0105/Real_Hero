import Request from "../models/Request.mjs";
import User from "../models/User.mjs";

/**
 * Checks for fraudulent activity or fake donors.
 * @param {string} userId - ID of the user to check
 * @param {string} type - 'request' or 'claim'
 * @returns {Promise<Object>} - { isFraud: boolean, reason: string }
 */
export const detectFraud = async (userId, type) => {
    try {
        const user = await User.findById(userId);
        if (!user) return { isFraud: false };

        // 1. Reliability Score check
        if (user.reliabilityScore < 30) {
            return { isFraud: true, reason: "Extremely low reliability score. Account suspended from this action." };
        }

        // 2. Velocity Check (Burst activity)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (type === 'request') {
            const recentRequests = await Request.countDocuments({
                requesterId: userId,
                createdAt: { $gte: oneHourAgo }
            });
            if (recentRequests > 3) {
                return { isFraud: true, reason: "Too many requests created in a short time. Potential spam." };
            }
        }

        // 3. Duplicate Description check (Basic)
        // This could be enhanced with vector similarity in a production environment

        return { isFraud: false };
    } catch (error) {
        console.error('Fraud detection failed:', error);
        return { isFraud: false };
    }
};
