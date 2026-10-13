import type { Request, Response } from 'express';
import { getTeamMembers, inviteTeamMember } from './team.service.js';
import { inviteTeamMemberSchema } from './team.schema.js';

export async function handleGetTeamMembers(req: Request, res: Response) {
  try {
    const userId = (req as Request & { userId?: string }).userId!;
    const userRole = (req as Request & { userRole?: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'QA' }).userRole!;

    const members = await getTeamMembers(userId, userRole);

    return res.status(200).json({
      success: true,
      message: 'Team members fetched successfully',
      data: { members },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch team members';
    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function handleInviteTeamMember(req: Request, res: Response) {
  try {
    const userId = (req as Request & { userId?: string }).userId!;
    const userRole = (req as Request & { userRole?: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'QA' }).userRole!;

    const validationResult = inviteTeamMemberSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message ?? 'Invalid input',
      });
    }

    const member = await inviteTeamMember(userId, userRole, validationResult.data);

    return res.status(201).json({
      success: true,
      message: 'Team member invited successfully',
      data: { member },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to invite team member';
    return res.status(400).json({
      success: false,
      message,
    });
  }
}
