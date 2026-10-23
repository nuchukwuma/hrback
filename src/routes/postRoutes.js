import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import * as posts from '../controller/postController.js';

const router = express.Router();
const handle = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect);

router.get('/', handle(posts.getPosts));
router.post('/', handle(posts.createPost)); // the controller decides who may post to whom
router.post('/:id/comments', handle(posts.addComment));
router.patch('/:id/pin', requireRole('hr'), handle(posts.togglePin));
router.delete('/:id', handle(posts.deletePost));

export default router;
