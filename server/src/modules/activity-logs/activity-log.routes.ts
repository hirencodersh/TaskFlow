import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';

import { list } from './activity-log.controller.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  list,
);

export default router;