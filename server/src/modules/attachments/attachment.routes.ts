import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';

import {
  list,
  remove,
  upload,
} from './attachment.controller.js';

import { uploadAttachment } from './attachment.upload.js';

const router = Router();

router.post(
  '/tasks/:taskId/attachments',
  requireAuth,
  uploadAttachment.single('file'),
  upload,
);

router.get(
  '/tasks/:taskId/attachments',
  requireAuth,
  list,
);

router.delete(
  '/attachments/:id',
  requireAuth,
  remove,
);

export default router;