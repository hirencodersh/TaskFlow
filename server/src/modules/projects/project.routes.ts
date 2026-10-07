import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';

import {
  addMember,
  create,
  getAvailableUsers,
  getById,
  getMembers,
  list,
  remove,
  removeMember,
  update,
} from './project.controller.js';

const router = Router();

router.post('/', requireAuth, create);

router.get('/', requireAuth, list);

router.get(
  '/:projectId/users',
  requireAuth,
  getAvailableUsers,
);
router.get('/:id/members', requireAuth, getMembers);
router.post('/:id/members', requireAuth, addMember);
router.delete('/:id/members/:userId', requireAuth, removeMember);

router.get('/:id', requireAuth, getById);
router.patch('/:id', requireAuth, update);
router.delete('/:id', requireAuth, remove);



export default router;