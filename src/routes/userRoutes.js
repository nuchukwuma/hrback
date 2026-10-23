import express from 'express';
import { inviteUser } from '../controller/userController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/invite', protect, requireRole('hr'), inviteUser);

export default router;
