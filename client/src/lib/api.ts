import axios from 'axios';

import { useAuthStore } from '../store/auth.store';

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken =
    useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization =
      `Bearer ${accessToken}`;
  }

  return config;
});

export default api;
