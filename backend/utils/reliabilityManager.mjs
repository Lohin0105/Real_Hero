import User from "../models/User.mjs";

/**
 * Updates a donor's reliability score based on their actions.
 * @param {string} userId - ID of the user
 * @param {string} action - 'accept', 'cancel', 'complete', 'no_show'
 */
export const updateReliability = async (userId, action) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        let delta = 0;
        switch (action) {
            case 'accept':
                delta = 2; // Slight boost for saying yes
                break;
            case 'cancel':
                delta = -10; // Penalty for backing out
                break;
            case 'complete':
                delta = 15; // Significant boost for successful donation
                break;
            case 'no_show':
                delta = -20; // Severe penalty for no-show
                break;
            default:
                break;
        }

        // Cap the score between 0 and 200
        const newScore = Math.min(200, Math.max(0, (user.reliabilityScore || 100) + delta));

        await User.findByIdAndUpdate(userId, { reliabilityScore: newScore });
        console.log(`Updated reliability score for user ${userId}: ${newScore} (Action: ${action})`);
    } catch (error) {
        console.error('Failed to update reliability score:', error);
    }
};
