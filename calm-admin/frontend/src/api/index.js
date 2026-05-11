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

// Handle 401 responses (token expirado o inválido)
// Reglas:
//  - 403 (Forbidden) NUNCA desloguea — solo indica falta de permisos para ese recurso
//  - 401 solo desloguea si NO viene del endpoint de login ni del endpoint de validate
//    (evita loop: credenciales incorrectas → 401 desde /auth/login → redirect → loop)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Endpoints que nunca deben provocar logout aunque devuelvan 401
    const noLogoutEndpoints = ['/auth/login', '/auth/validate', '/sync', '/transcriptions/check-new'];
    const isNoLogout = noLogoutEndpoints.some(ep => url.includes(ep));

    if (status === 401 && !isNoLogout) {
      console.warn('[Auth] Sesión expirada o inválida, endpoint:', url);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Usar evento personalizado para que React Router maneje la navegación
      // y evitar hard-reload que borra el estado de la app
      window.dispatchEvent(new CustomEvent('auth:logout'));
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

export const getAudioUrl = (recordingId) => api.get(`/transcriptions/${recordingId}/audio`);

export const getAudioStreamUrl = (recordingId) => {
  return `${API_URL}/transcriptions/${recordingId}/audio/stream`;
};

export const analyzeTranscription = (recordingId) => api.post(`/transcriptions/${recordingId}/analyze`);

export const checkNewTranscriptions = () => api.post('/transcriptions/check-new');

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

// Sync
export const syncTranscriptions = () => api.post('/sync');

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

// Timeline
export const getTimelineEvents = () => api.get('/timeline/events');
export const createTimelineEvent = (event) => api.post('/timeline/events', event);
export const updateTimelineEvent = (id, event) => api.put(`/timeline/events/${id}`, event);
export const deleteTimelineEvent = (id) => api.delete(`/timeline/events/${id}`);
export const getTimelineMetrics = (groupBy = 'week', sellerId = null) => {
  const params = new URLSearchParams({ groupBy });
  if (sellerId) params.append('sellerId', sellerId);
  return api.get(`/timeline/metrics?${params.toString()}`);
};
export const getTimelineCompare = (eventDate, days = 14, sellerId = null) => {
  const params = new URLSearchParams({ eventDate, days: String(days) });
  if (sellerId) params.append('sellerId', sellerId);
  return api.get(`/timeline/compare?${params.toString()}`);
};

export default api;
