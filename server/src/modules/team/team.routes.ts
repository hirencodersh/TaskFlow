import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../auth/role.middleware.js';
import { handleGetTeamMembers, handleInviteTeamMember } from './team.controller.js';

const router = Router();

router.use(requireAuth, requireRole('PROJECT_MANAGER', 'ADMIN'));

router.get('/', handleGetTeamMembers);
router.post('/invite', handleInviteTeamMember);

export default router;
