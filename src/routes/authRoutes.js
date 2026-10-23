
import express from 'express';
import { login, logout, getMe } from '../controller/authController.js';
import { acceptInvite } from '../controller/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/accept-invite', acceptInvite);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
