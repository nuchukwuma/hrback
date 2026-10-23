import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import * as c from '../controller/shiftController.js';

const router = express.Router();

const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect);

router.get('/people', handle(c.getPeople));
router.get('/swaps', handle(c.getSwaps));
router.post('/swaps', handle(c.createSwap));
router.patch('/swaps/:id/review', requireRole('manager', 'hr'), handle(c.reviewSwap));
router.patch('/swaps/:id/cancel', handle(c.cancelSwap));

router.get('/', handle(c.getShifts));
router.post('/', requireRole('manager', 'hr'), handle(c.createShift));
router.post('/:id/clock-in', handle(c.clockIn));
router.post('/:id/clock-out', handle(c.clockOut));
router.delete('/:id', requireRole('manager', 'hr'), handle(c.cancelShift));

export default router;