import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';

import {
  create,
  getById,
  list,
  remove,
  update,
} from './project.controller.js';

const router = Router();

router.post('/', requireAuth, create);

router.get('/', requireAuth, list);

router.get('/:id', requireAuth, getById);

router.patch('/:id', requireAuth, update);

router.delete('/:id', requireAuth, remove);

export default router;
