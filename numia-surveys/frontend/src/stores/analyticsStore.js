import { create } from 'zustand';
import api from '../api/axios';

const useAnalyticsStore = create((set) => ({
  dashboardMetrics: null,
  surveyAnalytics: null,
  loading: false,
  error: null,

  fetchDashboardMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/analytics/dashboard');
      set({ dashboardMetrics: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar métricas', loading: false });
      return null;
    }
  },

  fetchSurveyAnalytics: async (surveyId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/analytics/surveys/${surveyId}`);
      set({ surveyAnalytics: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar analytics', loading: false });
      return null;
    }
  },

  clearAnalytics: () => set({ surveyAnalytics: null }),
}));

export default useAnalyticsStore;

