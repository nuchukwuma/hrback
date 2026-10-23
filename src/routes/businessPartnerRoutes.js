import express from 'express';
import {
  getBusinessPartners,
  getBusinessPartnerById,
  createBusinessPartner,
  updateBusinessPartner,
  deleteBusinessPartner,
} from '../controller/businessPartnerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .get(getBusinessPartners)
  .post(createBusinessPartner);

router.route('/:id')
  .get(getBusinessPartnerById)
  .put(updateBusinessPartner)
  .delete(deleteBusinessPartner);

export default router;