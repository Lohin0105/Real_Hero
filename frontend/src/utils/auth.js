/**
 * Utility to manage authentication state and JWT tokens in the frontend.
 */

const TOKEN_KEY = "hero_jwt_token";
const USER_KEY = "hero_user_data";

export const authUtils = {
    /**
     * Save JWT and user data to localStorage
     */
    setToken: (token, user) => {
        localStorage.setItem(TOKEN_KEY, token);
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },

    /**
     * Get JWT from localStorage
     */
    getToken: () => {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Get parsed user data from localStorage
     */
    getUser: () => {
        const data = localStorage.getItem(USER_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Clear auth data (Logout)
     */
    logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        // Optionally clear other related data
        localStorage.removeItem("newUserProfile");
    },

    /**
     * Check if user is logged in (has a token)
     */
    isLoggedIn: () => {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Helper to get API headers with token
     */
    getAuthHeaders: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        return {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        };
    }
};
