import express from 'express';
import {
    getUserStats,
    downloadCertificate,
    getPlatformForecast,
    getDonorReadiness,
    getShortageRisk,
    getDemandSimulation,
    getPlatformStats,
    getDonorLoyaltyTier,
    getBestDonationTime,
    getImpactTrajectory,
    getAIGenerativeInsight,
    getAIHealthAdvisor
} from '../controllers/analyticsController.mjs';
import { authMiddleware } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Public-ish (user id in path, no auth guard needed – getUserStats uses userId param)
router.get('/user/:userId', getUserStats);
router.get('/certificate/:donationId', downloadCertificate);
router.get('/platform-forecast', getPlatformForecast);
router.get('/platform-stats', getPlatformStats);

// All ML endpoints require auth
router.get('/ml/donor-readiness', authMiddleware, getDonorReadiness);
router.get('/ml/shortage-risk', authMiddleware, getShortageRisk);
router.get('/ml/demand-simulation', authMiddleware, getDemandSimulation);
router.get('/ml/loyalty-tier', authMiddleware, getDonorLoyaltyTier);
router.get('/ml/best-time', authMiddleware, getBestDonationTime);
router.get('/ml/impact-trajectory', authMiddleware, getImpactTrajectory);
router.get('/ml/generative-insight', authMiddleware, getAIGenerativeInsight);
router.get('/ml/health-advisor', authMiddleware, getAIHealthAdvisor);

export default router;
