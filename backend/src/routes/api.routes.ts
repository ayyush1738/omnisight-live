import { Router } from 'express';
import { ApiController } from '../controllers/api.controller';
import { RoomManager } from '../managers/room.manager';

const router = Router();

/**
 * 🚨 FIXED: Use the Singleton instance.
 * This ensures the API sees the same rooms as the SocketController.
 */
const roomManager = RoomManager.getInstance(); 
const apiController = new ApiController(roomManager);

// ==========================================
// REST API ROUTES (/api/v1)
// ==========================================

// Fetch past session logs from Firestore
router.get('/history', (req, res) => apiController.getSessionHistory(req, res));

// Get live active rooms for the Expert Dashboard
router.get('/rooms/active', (req, res) => apiController.getActiveRooms(req, res));

// Save a completed session log to Firestore
router.post('/log', (req, res) => apiController.saveSessionLog(req, res));

// Simple Health Check
router.get('/status', (req, res) => {
  res.status(200).json({ 
    service: 'OmniSight REST API', 
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

export default router;