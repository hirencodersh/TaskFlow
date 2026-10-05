
import { Router } from 'express';

import { requireAuth } from './auth.middleware.js';

import {
  login,
  logout,
  me,
  refresh,
  register,
} from './auth.controller.js';

import {
  requestReset,
  reset,
} from './password-reset.controller.js';

import {
  authRateLimiter,
} from '../../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.post('/refresh', refresh);

router.post('/logout', logout);

router.get('/me', requireAuth, me);

router.post('/forgot-password', requestReset);
router.post('/reset-password', reset);

router.post(
  '/login',
  authRateLimiter,
  login,
);

router.post(
  '/forgot-password',
  authRateLimiter,
  requestReset,
);

router.post(
  '/reset-password',
  authRateLimiter,
  reset,
);

export default router;
