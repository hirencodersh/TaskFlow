import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { getAnalytics } from './analytics.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAnalytics);

export default router;
