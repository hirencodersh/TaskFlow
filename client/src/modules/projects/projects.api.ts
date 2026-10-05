import api from '../../lib/api';

export type ProjectStatus =
  | 'PLANNING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ARCHIVED';

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type ProjectsResponse = {
  success: boolean;
  data: {
    projects: Project[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export async function getProjects() {
  const response =
    await api.get<ProjectsResponse>('/projects');

  return response.data;
}

export async function getProjectById(
  projectId: string,
) {
  const response =
    await api.get<{
      success: boolean;
      data: {
        project: Project;
      };
    }>(`/projects/${projectId}`);

  return response.data;
}

export async function getProjectMembers(
  projectId: string,
) {
  const response =
    await api.get<{
      success: boolean;
      data: {
        members: ProjectMember[];
      };
    }>(
      `/projects/${projectId}/members`,
    );

  return response.data;
}

type CreateProjectInput = {
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  dueDate?: string;
};

type CreateProjectResponse = {
  success: boolean;
  message?: string;
  data: {
    project: Project;
  };
};

export async function createProject(
  input: CreateProjectInput,
) {
  const response =
    await api.post<CreateProjectResponse>(
      '/projects',
      input,
    );

  return response.data;
}

export type AvailableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

type UsersResponse = {
  success: boolean;
  data: {
    users: AvailableUser[];
  };
};

export async function getUsers() {
  const response =
    await api.get<UsersResponse>(
      '/admin/users',
    );

  return response.data;
}


type AddProjectMemberInput = {
  userId: string;
};

type AddProjectMemberResponse = {
  success: boolean;
  message?: string;
  data: {
    member: ProjectMember;
  };
};

export async function addProjectMember(
  projectId: string,
  input: AddProjectMemberInput,
) {
  const response =
    await api.post<AddProjectMemberResponse>(
      `/projects/${projectId}/members`,
      input,
    );

  return response.data;
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
) {
  const response =
    await api.delete(
      `/projects/${projectId}/members/${userId}`,
    );

  return response.data;
}