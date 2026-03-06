import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.mjs';
import User from '../models/User.mjs';
import dotenv from 'dotenv';
import { predictAcceptance } from '../utils/aiService.mjs';
import Offer from '../models/Offer.mjs';
dotenv.config();

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:vtu23036@veltech.edu.in',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Subscribe user to push notifications
export const subscribe = async (req, res) => {
    try {
        const { subscription, userId } = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        // Check if subscription already exists
        const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
        if (existing) {
            return res.status(200).json({ message: 'Already subscribed', subscription: existing });
        }

        // Create new subscription
        const newSubscription = await PushSubscription.create({
            userId: userId || req.user?._id,
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            },
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({ message: 'Subscribed successfully', subscription: newSubscription });
    } catch (error) {
        console.error('Push subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe', details: error.message });
    }
};

// Unsubscribe user from push notifications
export const unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;

        await PushSubscription.deleteOne({ endpoint });

        res.status(200).json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to unsubscribe', details: error.message });
    }
};

// Send push notification to specific user
export const sendToUser = async (req, res) => {
    try {
        const { userId, title, body, data } = req.body;

        // Get all subscriptions for this user
        const subscriptions = await PushSubscription.find({ userId });

        if (subscriptions.length === 0) {
            return res.status(404).json({ error: 'No subscriptions found for user' });
        }

        const payload = JSON.stringify({
            title: title || 'Blood Donation Alert',
            body: body || 'You have a new notification',
            icon: '/logo192.png',
            badge: '/logo192.png',
            data: data || {}
        });

        // Send to all user's subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(sub =>
                webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys.p256dh,
                        auth: sub.keys.auth
                    }
                }, payload)
            )
        );

        // Remove failed subscriptions (expired/invalid)
        const failedIndexes = results
            .map((result, index) => result.status === 'rejected' ? index : null)
            .filter(index => index !== null);

        if (failedIndexes.length > 0) {
            await PushSubscription.deleteMany({
                _id: { $in: failedIndexes.map(i => subscriptions[i]._id) }
            });
        }

        res.status(200).json({
            message: 'Notifications sent',
            sent: results.filter(r => r.status === 'fulfilled').length,
            failed: failedIndexes.length
        });
    } catch (error) {
        console.error('Send push notification error:', error);
        res.status(500).json({ error: 'Failed to send notification', details: error.message });
    }
};

// Notify matching donors when new request is created
export const notifyMatchingDonors = async (request) => {
    try {
        const [lng, lat] = request.locationGeo?.coordinates || [];
        const hasGeo = typeof lng === 'number' && typeof lat === 'number';
        const radiusInMeters = 50000; // 50km
        const radiusInRadians = radiusInMeters / 6378137;

        // Exclude the requester
        const excludeFilter = { _id: { $ne: request.requesterId } };

        let usersToNotify = [];

        // --- PASS 1: Geo-based search (users who have saved their location) ---
        if (hasGeo) {
            console.log(`notifyMatchingDonors: PASS 1 — geo search near [${lng}, ${lat}] within ${radiusInMeters / 1000}km`);
            const geoUsers = await User.find({
                ...excludeFilter,
                locationGeo: {
                    $geoWithin: {
                        $centerSphere: [[lng, lat], radiusInRadians]
                    }
                }
            });
            console.log(`notifyMatchingDonors: PASS 1 found ${geoUsers.length} users with saved location`);
            usersToNotify = geoUsers;
        }

        // --- PASS 2: Fallback — notify ALL users if geo found nobody ---
        if (usersToNotify.length === 0) {
            console.log(`notifyMatchingDonors: PASS 2 — geo found 0, falling back to ALL users`);
            usersToNotify = await User.find(excludeFilter);
            console.log(`notifyMatchingDonors: PASS 2 found ${usersToNotify.length} users`);
        }

        if (usersToNotify.length === 0) {
            console.log('notifyMatchingDonors: No users to notify.');
            return;
        }

        const payload = JSON.stringify({
            title: '🩸 Blood Donation Request Nearby',
            body: `${request.bloodGroup} blood needed at ${request.hospital}. Open app to help!`,
            icon: '/logo192.png',
            badge: '/logo192.png',
            data: {
                requestId: request._id,
                bloodGroup: request.bloodGroup,
                hospital: request.hospital,
                url: '/donate'
            }
        });

        // Get all push subscriptions for matched users
        const userIds = usersToNotify.map(d => d._id);
        const subscriptions = await PushSubscription.find({ userId: { $in: userIds } });

        if (subscriptions.length === 0) {
            console.log(`notifyMatchingDonors: No push subscriptions found for ${usersToNotify.length} users`);
            return;
        }

        // === AI INTELLIGENCE CORE: PRIORITIZATION ===
        console.log('Calculating AI priority scores for matching donors...');

        // 1. Prepare donor features for AI
        const donorFeatures = usersToNotify.map(donor => {
            // Heuristic for now: distance if available
            let distance = 25; // default 25km
            if (request.locationGeo && donor.locationGeo) {
                const [lon1, lat1] = donor.locationGeo.coordinates;
                const [lon2, lat2] = request.locationGeo.coordinates;
                // Simple Euclidean distance for mock (should use Haversine in production)
                distance = Math.sqrt(Math.pow(lon1 - lon2, 2) + Math.pow(lat1 - lat2, 2)) * 111;
            }

            return {
                donor_id: donor._id.toString(),
                distance: parseFloat(distance.toFixed(2)),
                last_donation_days: donor.lastDonation ? Math.floor((Date.now() - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24)) : 90,
                historic_acceptance_rate: donor.donationsCount > 0 ? 0.8 : 0.4, // Simplified for now
                response_delay_avg: 15, // minutes
                emergency_level: request.urgency === 'High' ? 3 : request.urgency === 'Medium' ? 2 : 1
            };
        });

        // 2. Get predictions from AI Service
        const predictions = await predictAcceptance(donorFeatures);

        // 3. Map predictions back to donor IDs and subscriptions
        const donorPriorityMap = {};
        predictions.forEach((pred, idx) => {
            const donorId = usersToNotify[idx]._id.toString();
            donorPriorityMap[donorId] = pred.probability;
        });

        // 4. Sort subscriptions by donor probability
        const sortedSubscriptions = subscriptions.sort((a, b) => {
            const probA = donorPriorityMap[a.userId.toString()] || 0;
            const probB = donorPriorityMap[b.userId.toString()] || 0;
            return probB - probA;
        });

        console.log(`Sending AI-prioritized notifications. Top priority score: ${predictions[0]?.probability || 0}`);

        // Send notifications
        const results = await Promise.allSettled(
            sortedSubscriptions.map(sub =>
                webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys.p256dh,
                        auth: sub.keys.auth
                    }
                }, payload)
            )
        );

        // Clean up failed subscriptions
        const failedIndexes = results
            .map((result, index) => result.status === 'rejected' ? index : null)
            .filter(index => index !== null);

        if (failedIndexes.length > 0) {
            await PushSubscription.deleteMany({
                _id: { $in: failedIndexes.map(i => subscriptions[i]._id) }
            });
        }

        console.log(`Push notifications sent: ${results.filter(r => r.status === 'fulfilled').length} succeeded, ${failedIndexes.length} failed`);
    } catch (error) {
        console.error('Notify matching donors error:', error);
    }
};

// Get VAPID public key for frontend
export const getPublicKey = (req, res) => {
    res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
