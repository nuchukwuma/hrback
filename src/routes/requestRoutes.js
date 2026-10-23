import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import * as requestController from '../controller/requestController.js';

const router = express.Router();

const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect);

router.post('/', handle(requestController.createRequest));
router.get('/mine', handle(requestController.getMyRequests));
router.get('/inbox', requireRole('manager', 'hr'), handle(requestController.getRequestInbox));
router.get('/activity', handle(requestController.getRequestActivity));
router.patch('/:id/status', requireRole('manager', 'hr'), handle(requestController.updateRequestStatus));

export default router;
