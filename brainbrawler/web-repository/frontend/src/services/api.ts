import axios from 'axios';
import { AuthResponse, User, QuestionSet, Game } from '../types';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brainbrawler_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('brainbrawler_token');
      localStorage.removeItem('brainbrawler_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { username: string; email: string; password: string; accountType?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  
  me: () => api.get<User>('/auth/me'),
};

export const questionSetAPI = {
  getPublic: () => api.get<QuestionSet[]>('/question-sets/public'),
  getMy: () => api.get<QuestionSet[]>('/question-sets/my-sets'),
  upload: (data: any) => api.post('/question-sets/bulk-upload', data),
  getById: (id: string) => api.get<QuestionSet>(`/question-sets/${id}`),
};

export const gameAPI = {
  getAvailable: () => api.get<Game[]>('/games/available'),
  create: (data: any) => api.post<Game>('/games/create', data),
  join: (id: string, password?: string) => api.post(`/games/${id}/join`, { password }),
  getById: (id: string) => api.get<Game>(`/games/${id}`),
};

export const userAPI = {
  search: (q: string) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getProfile: (id: string) => api.get(`/users/profile/${id}`),
};

export const friendAPI = {
  sendRequest: (addresseeId: string) => api.post('/friends/request', { addresseeId }),
  getRequests: () => api.get('/friends/requests'),
  handleRequest: (id: string, action: 'accept' | 'reject') => 
    api.patch(`/friends/request/${id}`, { action }),
  getList: () => api.get('/friends/list'),
};

export default api; 