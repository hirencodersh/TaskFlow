import { create } from 'zustand';

export type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (
    user: AuthUser,
    accessToken: string,
  ) => void;

  setAccessToken: (
    accessToken: string,
  ) => void;

  clearAuth: () => void;
};

export const useAuthStore =
  create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,

    setAuth: (user, accessToken) =>
      set({
        user,
        accessToken,
        isAuthenticated: true,
      }),

    setAccessToken: (accessToken) =>
      set({
        accessToken,
      }),

    clearAuth: () =>
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      }),
  }));