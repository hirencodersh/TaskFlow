import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';

import {
  create,
  list,
  update,
  remove,
  assign,
  removeFromTask,
} from './label.controller.js';

const router = Router();
router.post(
  '/',
  requireAuth,
  create,
);

router.get(
  '/project/:projectId',
  requireAuth,
  list,
);

router.patch(
  '/:id',
  requireAuth,
  update,
);

router.delete(
  '/:id',
  requireAuth,
  remove,
);

router.post(
  '/task/:taskId',
  requireAuth,
  assign,
);

router.delete(
  '/task/:taskId/:labelId',
  requireAuth,
  removeFromTask,
);

export default router;