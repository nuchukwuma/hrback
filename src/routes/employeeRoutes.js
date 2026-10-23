import express from 'express';
import { createEmployee, getEmployees, getManagers } from '../controller/employeeController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getEmployees);
router.get('/managers', requireRole('hr'), getManagers);
router.post('/', requireRole('hr'), createEmployee);

export default router;
