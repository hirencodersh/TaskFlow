import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { list, markRead, markAllRead, remove } from './notification.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);
router.delete('/:id', remove);

export default router;
