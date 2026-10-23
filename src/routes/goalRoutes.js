import express from 'express';
import { protect } from '../middleware/auth.js';
import * as goals from '../controller/goalController.js';

const router = express.Router();
const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect);

router.get('/', handle(goals.getGoals));
router.post('/', handle(goals.createGoal));
router.patch('/:id/progress', handle(goals.updateProgress));
router.delete('/:id', handle(goals.deleteGoal));

export default router;
