import api from '../../lib/api';

export type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER'
  | 'DESIGNER'
  | 'QA';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions?: Record<string, boolean>;
  createdAt?: string;
  stats?: {
    totalAssigned: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
  };
  assignedTasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    projectId: string;
    project: { name: string };
  }>;
  projectMemberships?: Array<{
    project: {
      id: string;
      name: string;
      status: string;
      ownerId: string;
    };
  }>;
};

type UsersResponse = {
  success: boolean;
  data: {
    users: AdminUser[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export async function getAdminUsers() {
  const response =
    await api.get<UsersResponse>('/admin/users');

  return response.data;
}

export async function getAdminUserById(userId: string) {
  const response = await api.get<{
    success: boolean;
    data: AdminUser;
  }>(`/admin/users/${userId}`);

  return response.data;
}

type UpdateUserRoleInput = {
  role: UserRole;
};

type UpdateUserRoleResponse = {
  success: boolean;
  message?: string;
  data: AdminUser;
};

export async function updateAdminUserRole(
  userId: string,
  input: UpdateUserRoleInput,
) {
  const response =
    await api.patch<UpdateUserRoleResponse>(
      `/admin/users/${userId}/role`,
      input,
    );

  return response.data;
}

export async function approveAdminUser(
  userId: string,
  role: UserRole,
) {
  const response = await api.patch<{
    success: boolean;
    message?: string;
    data: { user: AdminUser };
  }>(`/admin/users/${userId}/approve`, { role });

  return response.data;
}

type UpdateUserPermissionsInput = {
  permissions: Record<string, boolean>;
};

export async function updateAdminUserPermissions(
  userId: string,
  input: UpdateUserPermissionsInput,
) {
  const response = await api.patch<{
    success: boolean;
    message?: string;
    data: AdminUser;
  }>(`/admin/users/${userId}/permissions`, input);

  return response.data;
}

type UpdateUserStatusInput = {
  isActive: boolean;
};

type UpdateUserStatusResponse = {
  success: boolean;
  message?: string;
  data: AdminUser;
};

export async function updateAdminUserStatus(
  userId: string,
  input: UpdateUserStatusInput,
) {
  const response =
    await api.patch<UpdateUserStatusResponse>(
      `/admin/users/${userId}/status`,
      input,
    );

  return response.data;
}

type CreateAdminUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type CreateAdminUserResponse = {
  success: boolean;
  message?: string;
  data: {
    user: AdminUser;
  };
};

export async function createAdminUser(
  input: CreateAdminUserInput,
) {
  const response =
    await api.post<CreateAdminUserResponse>(
      '/admin/users',
      input,
    );

  return response.data;
}

export async function deleteAdminUser(
  userId: string,
) {
  const response = await api.delete<{
    success: boolean;
    message?: string;
  }>(`/admin/users/${userId}`);

  return response.data;
}
