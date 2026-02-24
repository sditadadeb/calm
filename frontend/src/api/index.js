import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
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

// Solo cerrar sesión en 401 (token inválido/vencido).
// Un 403 puede ser simplemente falta de permisos en un endpoint específico.
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
  if (filters.resultadoLlamada) params.append('resultadoLlamada', filters.resultadoLlamada);
  if (filters.motivoPrincipal) params.append('motivoPrincipal', filters.motivoPrincipal);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.minScore) params.append('minScore', filters.minScore);
  if (filters.maxScore) params.append('maxScore', filters.maxScore);
  
  return api.get(`/transcriptions?${params.toString()}`);
};

export const getTranscription = (recordingId) => api.get(`/transcriptions/${recordingId}`);

export const getAudioUrl = (recordingId) => api.get(`/transcriptions/${recordingId}/audio`);

export const getAudioStreamUrl = (recordingId) => {
  const token = localStorage.getItem('token');
  return `${API_URL}/transcriptions/${recordingId}/audio/stream?token=${token}`;
};

export const analyzeTranscription = (recordingId) => api.post(`/transcriptions/${recordingId}/analyze`);

export const deleteTranscription = (recordingId) => api.delete(`/transcriptions/${recordingId}`);

// Search
export const searchTranscriptions = (query, filters = {}) => {
  const params = new URLSearchParams();
  params.append('q', query);
  
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.branchId) params.append('branchId', filters.branchId);
  if (filters.saleCompleted !== null && filters.saleCompleted !== undefined) {
    params.append('saleCompleted', filters.saleCompleted);
  }
  
  return api.get(`/transcriptions/search?${params.toString()}`);
};

// Sync (timeout 5 min por si hay muchas grabaciones)
export const syncTranscriptions = () => api.post('/sync', {}, { timeout: 300000 });
// Auto-sync al entrar: timeout corto para no bloquear UI.
export const autoSyncTranscriptions = () => api.post('/sync', {}, { timeout: 25000 });
export const resetAllAnalysisData = () => api.post('/sync/analysis/reset');

// Filters data
export const getSellers = () => api.get('/sellers');
export const getBranches = () => api.get('/branches');

// Configuration
export const getPromptConfig = () => api.get('/config/prompt');
export const updatePromptConfig = (config) => api.put('/config/prompt', config);
export const resetPromptConfig = () => api.post('/config/prompt/reset');

// Re-analyze all (returns SSE stream URL)
export const getReanalyzeAllStreamUrl = () => {
  const token = localStorage.getItem('token');
  return `${API_URL}/reanalyze-all/stream?token=${token}`;
};

// Recommendations (Advanced Analysis)
export const getRecommendationsMetrics = () => api.get('/recommendations/metrics');
export const getRecommendationsByVendor = () => api.get('/recommendations/by-vendor');
export const clearRecommendationsAnalyses = () => api.delete('/recommendations/clear');

export default api;
