import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) => 
  api.post('/auth/login', { username, password });

export const validateToken = () => api.post('/auth/validate');

export const getCurrentUser = () => api.get('/auth/me');

// Dashboard metrics
export const getDashboardMetrics = () => api.get('/dashboard');

// Transcriptions
export const getTranscriptions = (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.branchId) params.append('branchId', filters.branchId);
  if (filters.saleCompleted !== null && filters.saleCompleted !== undefined) {
    params.append('saleCompleted', filters.saleCompleted);
  }
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.minScore) params.append('minScore', filters.minScore);
  if (filters.maxScore) params.append('maxScore', filters.maxScore);
  
  return api.get(`/transcriptions?${params.toString()}`);
};

export const getTranscription = (recordingId) => api.get(`/transcriptions/${recordingId}`);

export const analyzeTranscription = (recordingId) => api.post(`/transcriptions/${recordingId}/analyze`);

// Sync
export const syncTranscriptions = () => api.post('/sync');

// Filters data
export const getSellers = () => api.get('/sellers');
export const getBranches = () => api.get('/branches');

// Configuration
export const getPromptConfig = () => api.get('/config/prompt');
export const updatePromptConfig = (config) => api.put('/config/prompt', config);
export const resetPromptConfig = () => api.post('/config/prompt/reset');

export default api;
