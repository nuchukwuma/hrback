import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { getTeams } from '../controller/teamController.js';

const router = express.Router();
const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', protect, requireRole('manager', 'hr'), handle(getTeams));

export default router;
