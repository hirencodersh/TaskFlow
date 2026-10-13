import api from '../../lib/api';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: 'PROJECT_MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'QA';
  isActive: boolean;
  createdAt: string;
};

type TeamMembersResponse = {
  success: boolean;
  data: {
    members: TeamMember[];
  };
};

type InviteMemberInput = {
  name: string;
  email: string;
  password: string;
  role: 'PROJECT_MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'QA';
};

type InviteMemberResponse = {
  success: boolean;
  message: string;
  data: {
    member: TeamMember;
  };
};

export async function getTeamMembers() {
  const response = await api.get<TeamMembersResponse>('/team');
  return response.data;
}

export async function inviteTeamMember(input: InviteMemberInput) {
  const response = await api.post<InviteMemberResponse>('/team/invite', input);
  return response.data;
}
