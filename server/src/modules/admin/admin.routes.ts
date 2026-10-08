import { Router } from 'express';

import {
  requireAuth,
} from '../auth/auth.middleware.js';

import {
  requireRole,
} from '../auth/role.middleware.js';

import {
  create,
  getOne,
  list,
  remove,
  updateRole,
  updateStatus,
} from './admin.controller.js';

const router = Router();

router.use(
  requireAuth,
  requireRole('ADMIN'),
);

router.get('/', list);

router.post('/', create);

router.get('/:id', getOne);

router.patch('/:id/role', updateRole);

router.patch('/:id/status', updateStatus);

router.delete('/:id', remove);

export default router;
