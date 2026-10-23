// routes/profileRoutes.js
import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import {
  getMyProfile, updateMyProfile, getProfile, updateProfileAsHR, uploadMyPhoto, uploadPhotoAsHR,
} from '../controller/profileController.js';

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);                                 // employee: contact details only
router.get('/:userId', protect, requireRole('manager', 'hr'), getProfile);   // scoped to their team
router.put('/:userId', protect, requireRole('hr'), updateProfileAsHR);       // HR: everything
router.post('/me/photo', protect, uploadMyPhoto);                            // employee: own photo
router.post('/:userId/photo', protect, requireRole('hr'), uploadPhotoAsHR);  // HR: anyone's photo

export default router;
