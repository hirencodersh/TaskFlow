import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';
import type { InviteTeamMemberInput } from './team.schema.js';

type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'QA';

export async function getTeamMembers(_userId: string, userRole: UserRole) {
  if (userRole !== 'ADMIN' && userRole !== 'PROJECT_MANAGER') {
    throw new Error('Only Project Managers and Admins can access team management');
  }

  return prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        not: 'ADMIN',
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function inviteTeamMember(_userId: string, userRole: UserRole, input: InviteTeamMemberInput) {
  if (userRole !== 'ADMIN' && userRole !== 'PROJECT_MANAGER') {
    throw new Error('Only Project Managers and Admins can invite team members');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email.toLowerCase(),
    },
  });

  if (existingUser) {
    throw new Error('A user with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}
