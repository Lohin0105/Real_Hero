import express from 'express';
import { chatWithMediBot, getAllSessions, getSessionById, deleteSession, enhancePrompt } from '../controllers/medibotController.mjs';
import { authMiddleware } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Session Management Routes
router.get('/sessions', authMiddleware, getAllSessions);
router.get('/sessions/:sessionId', authMiddleware, getSessionById);
router.delete('/sessions/:sessionId', authMiddleware, deleteSession);

// Enhance prompt
router.post('/enhance-prompt', authMiddleware, enhancePrompt);

// Chat (supports image + imageType payload)
router.post('/chat', authMiddleware, chatWithMediBot);

export default router;
