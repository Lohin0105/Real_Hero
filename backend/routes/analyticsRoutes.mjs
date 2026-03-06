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

const router = express.Router();

// Existing
router.get('/user/:userId', getUserStats);
router.get('/certificate/:donationId', downloadCertificate);
router.get('/platform-forecast', getPlatformForecast);

// ML Models 1-3
router.get('/ml/donor-readiness', getDonorReadiness);
router.get('/ml/shortage-risk', getShortageRisk);
router.get('/ml/demand-simulation', getDemandSimulation);

// ML Models 4-6
router.get('/ml/loyalty-tier', getDonorLoyaltyTier);
router.get('/ml/best-time', getBestDonationTime);
router.get('/ml/impact-trajectory', getImpactTrajectory);

// AI Models 7-8
router.get('/ml/generative-insight', getAIGenerativeInsight);
router.get('/ml/health-advisor', getAIHealthAdvisor);

// Platform stats
router.get('/platform-stats', getPlatformStats);

export default router;
