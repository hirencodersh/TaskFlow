import api from '../../lib/api';

import type {
  AuthUser,
} from '../../store/auth.store';

type AuthResponse = {
  success: boolean;
  message?: string;
  data: {
    user: AuthUser;
    accessToken: string;
  };
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export async function register(
  input: RegisterInput,
) {
  const response =
    await api.post<AuthResponse>(
      '/auth/register',
      input,
    );

  return response.data;
}

export async function login(
  input: LoginInput,
) {
  const response =
    await api.post<AuthResponse>(
      '/auth/login',
      input,
    );

  return response.data;
}

export async function refresh() {
  const response =
    await api.post<AuthResponse>(
      '/auth/refresh',
    );

  return response.data;
}

export async function logout() {
  const response =
    await api.post(
      '/auth/logout',
    );

  return response.data;
}

export async function getMe() {
  const response =
    await api.get<{
      success: boolean;
      data: {
        user: AuthUser;
      };
    }>('/auth/me');

  return response.data;
}