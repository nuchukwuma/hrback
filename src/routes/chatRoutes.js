import express from 'express';
import { protect } from '../middleware/auth.js';
import * as chat from '../controller/chatController.js';

const router = express.Router();

const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect);

router.get('/', handle(chat.getChannels));
router.post('/', handle(chat.createChannel));

router.get('/:id/messages', handle(chat.getMessages));
router.post('/:id/read', handle(chat.markRead));
router.post('/:id/members', handle(chat.addMember));
router.delete('/:id/members/:userId', handle(chat.removeMember));

export default router;
