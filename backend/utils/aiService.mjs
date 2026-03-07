import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT_MS = 5000; // 5 second timeout for all AI calls

/**
 * Helper: wraps fetch with an AbortController timeout.
 */
const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timer);
    }
};

/**
 * Predicts the list of donors most likely to accept a request.
 * @param {Array} donors - List of donor features
 * @returns {Promise<Array>} - List of predictions with probabilities
 */
export const predictAcceptance = async (donors) => {
    try {
        const response = await fetchWithTimeout(`${AI_SERVICE_URL}/predict-acceptance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donors)
        });

        if (!response.ok) {
            throw new Error(`AI Service Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error.code !== 'ECONNREFUSED' && error.name !== 'AbortError') {
            console.warn('predictAcceptance error:', error.message);
        }
        // Fallback: return neutral predictions
        return donors.map((d, i) => ({
            donor_id: d.donor_id || `donor_${i}`,
            probability: 0.5,
            priority_tier: 'Medium'
        }));
    }
};

/**
 * Gets blood demand forecast for a group and region.
 * @param {string} bloodGroup
 * @param {string} region
 * @param {Array} history - Array of previous days requests counts
 * @returns {Promise<Object|null>}
 */
export const getDemandForecast = async (bloodGroup, region, history = []) => {
    try {
        const response = await fetchWithTimeout(`${AI_SERVICE_URL}/forecast-demand`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blood_group: bloodGroup, region, history })
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        if (error.code !== 'ECONNREFUSED' && error.name !== 'AbortError') {
            console.warn('getDemandForecast error:', error.message);
        }
        return null;
    }
};

/**
 * Predicts shortage risk for a specific blood group and features.
 * @param {Object} features - Risk features
 * @returns {Promise<Object|null>}
 */
export const predictRisk = async (features) => {
    try {
        const response = await fetchWithTimeout(`${AI_SERVICE_URL}/predict-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(features)
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        if (error.code !== 'ECONNREFUSED' && error.name !== 'AbortError') {
            console.warn('predictRisk error:', error.message);
        }
        return null;
    }
};

/**
 * Segments a list of donors based on RFM style features.
 * @param {Array} donors - List of donor segmentation features
 * @returns {Promise<Object|null>}
 */
export const segmentDonors = async (donors) => {
    try {
        const response = await fetchWithTimeout(`${AI_SERVICE_URL}/segment-donors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donors)
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        if (error.code !== 'ECONNREFUSED' && error.name !== 'AbortError') {
            console.warn('segmentDonors error:', error.message);
        }
        return null;
    }
};
