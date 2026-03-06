import express from 'express';
import { chatWithMediBot, getAllSessions, getSessionById, deleteSession } from '../controllers/medibotController.mjs';
import { authMiddleware } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Session Management Routes
router.get('/sessions', authMiddleware, getAllSessions);
router.get('/sessions/:sessionId', authMiddleware, getSessionById);
router.delete('/sessions/:sessionId', authMiddleware, deleteSession);

// Route to handle chat interactions (now supports sessionId payload)
router.post('/chat', authMiddleware, chatWithMediBot);

export default router;
