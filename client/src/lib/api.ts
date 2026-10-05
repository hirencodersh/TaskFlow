import axios from 'axios';

import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
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