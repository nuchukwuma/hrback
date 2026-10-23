import express from 'express';
import { protect } from '../middleware/auth.js';
import { getMyNotifications, markNotificationRead } from '../controller/notificationController.js';

const router = express.Router();
const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect);
router.get('/', handle(getMyNotifications));
router.patch('/:id/read', handle(markNotificationRead));

export default router;
