import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';

import {
  create,
  list,
  remove,
  update,
} from './comment.controller.js';

const router = Router();

router.post(
  '/tasks/:taskId/comments',
  requireAuth,
  create,
);

router.get(
  '/tasks/:taskId/comments',
  requireAuth,
  list,
);

router.patch(
  '/comments/:id',
  requireAuth,
  update,
);

router.delete(
  '/comments/:id',
  requireAuth,
  remove,
);

export default router;