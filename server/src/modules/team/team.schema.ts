import { z } from 'zod';

export const inviteTeamMemberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER', 'QA']),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
