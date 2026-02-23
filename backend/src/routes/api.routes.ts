import { Router } from 'express';
import { ApiController } from '../controllers/api.controller';

const router = Router();
const apiController = new ApiController();

// ==========================================
// REST API ROUTES (/api/v1)
// ==========================================

// Route to fetch previous OmniSight sessions
router.get('/history', apiController.getSessionHistory);

// Route to save a completed session
router.post('/log', apiController.saveSessionLog);

// Isolated API health check (Good practice for Load Balancers)
router.get('/status', (req, res) => {
  res.status(200).json({ service: 'OmniSight REST API', status: 'operational' });
});

export default router;