import api from '../../lib/api';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role:
    | 'ADMIN'
    | 'PROJECT_MANAGER'
    | 'DEVELOPER';
  isActive: boolean;
};

type UsersResponse = {
  success: boolean;
  data: {
    users: AdminUser[];
  };
};

export async function getAdminUsers() {
  const response =
    await api.get<UsersResponse>('/admin/users');

  return response.data;
}

type UpdateUserRoleInput = {
  role:
    | 'ADMIN'
    | 'PROJECT_MANAGER'
    | 'DEVELOPER';
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
  role: 'PROJECT_MANAGER' | 'DEVELOPER';
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