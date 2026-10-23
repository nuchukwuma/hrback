import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import {
  addTeamMember,
  createTeam,
  getTeamCandidates,
  getTeamMembers,
  getTeams,
  removeTeamMember,
} from '../controller/teamController.js';

const router = express.Router();
const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect, requireRole('manager', 'hr'));
router.get('/', handle(getTeams));
router.post('/', handle(createTeam));
router.get('/:teamId/candidates', handle(getTeamCandidates));
router.get('/:teamId/members', handle(getTeamMembers));
router.post('/:teamId/members', handle(addTeamMember));
router.delete('/:teamId/members/:userId', handle(removeTeamMember));

export default router;
