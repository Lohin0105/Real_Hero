import express from 'express';
import * as pushController from '../controllers/pushNotificationController.mjs';

const router = express.Router();

// Get VAPID public key
router.get('/public-key', pushController.getPublicKey);

// Subscribe to push notifications
router.post('/subscribe', pushController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', pushController.unsubscribe);

// Send notification to specific user (admin/testing)
router.post('/send', pushController.sendToUser);

export default router;
