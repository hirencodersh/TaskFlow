import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';

import {
  create,
  list,
  remove,
  update,
} from './label.controller.js';

import {
  add,
  list as listTaskLabels,
  remove as removeTaskLabel,
} from './task-label.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  create,
);

router.get(
  '/projects/:projectId',
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
  '/tasks/:taskId/labels',
  requireAuth,
  add,
);

router.get(
  '/tasks/:taskId/labels',
  requireAuth,
  listTaskLabels,
);

router.delete(
  '/tasks/:taskId/labels',
  requireAuth,
  removeTaskLabel,
);

export default router;