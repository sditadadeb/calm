import { create } from 'zustand';
import * as api from '../api';

const useStore = create((set, get) => ({
  // State
  dashboardMetrics: null,
  transcriptions: [],
  selectedTranscription: null,
  sellers: [],
  branches: [],
  filters: {
    userId: null,
    branchId: null,
    saleStatus: null,
    dateFrom: null,
    dateTo: null,
    minScore: null,
    maxScore: null,
    analyzed: null,
    saleCompleted: null,
    noSaleReason: null,
  },
  loading: false,
  recalculating: false,
  error: null,

  // Actions
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        userId: null,
        branchId: null,
        saleStatus: null,
        dateFrom: null,
        dateTo: null,
        minScore: null,
        maxScore: null,
        analyzed: null,
        saleCompleted: null,
        noSaleReason: null,
      }
    });
  },

  fetchDashboardMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getDashboardMetrics();
      set({ dashboardMetrics: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTranscriptions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTranscriptions();
      set({ transcriptions: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTranscription: async (recordingId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTranscription(recordingId);
      set({ selectedTranscription: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  analyzeTranscription: async (recordingId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.analyzeTranscription(recordingId);
      set({ selectedTranscription: response.data, loading: false });
      await Promise.all([
        get().fetchTranscriptions(),
        get().fetchDashboardMetrics(),
      ]);
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchSellers: async () => {
    try {
      const response = await api.getSellers();
      set({ sellers: response.data });
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  },

  fetchBranches: async () => {
    try {
      const response = await api.getBranches();
      set({ branches: response.data });
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  },

  /**
   * Once per session: import new S3 recordings, refresh placeholder transcriptions,
   * and trigger GPT analysis when text is now available.
   */
  checkPendingFromS3: async () => {
    if (sessionStorage.getItem('s3Checked')) return null;
    try {
      const response = await api.checkNewTranscriptions();
      sessionStorage.setItem('s3Checked', '1');
      await Promise.all([
        get().fetchDashboardMetrics(),
        get().fetchTranscriptions(),
      ]);
      return response.data;
    } catch (error) {
      console.error('Error checking pending transcriptions:', error);
      sessionStorage.setItem('s3Checked', '1');
      return null;
    }
  },

  syncFromS3: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.syncTranscriptions();
      // Refresh data after sync
      await get().fetchDashboardMetrics();
      await get().fetchTranscriptions();
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearSelectedTranscription: () => {
    set({ selectedTranscription: null });
  },

  deleteTranscription: async (recordingId) => {
    try {
      await api.deleteTranscription(recordingId);
      
      // Mostrar barra de recalculando
      set({ recalculating: true });
      
      // Recalcular todas las métricas
      await Promise.all([
        get().fetchDashboardMetrics(),
        get().fetchTranscriptions(),
        get().fetchSellers(),
        get().fetchBranches(),
      ]);
      
      set({ recalculating: false });
      return { success: true };
    } catch (error) {
      set({ recalculating: false });
      throw error;
    }
  },

  excludeTranscription: async (recordingId) => {
    try {
      await api.excludeTranscription(recordingId);

      set({ recalculating: true });

      await Promise.all([
        get().fetchDashboardMetrics(),
        get().fetchTranscriptions(),
        get().fetchSellers(),
        get().fetchBranches(),
      ]);

      set({ recalculating: false });
      return { success: true };
    } catch (error) {
      set({ recalculating: false });
      throw error;
    }
  },

  restoreTranscription: async (recordingId) => {
    try {
      await api.restoreTranscription(recordingId);

      set({ recalculating: true });

      await Promise.all([
        get().fetchDashboardMetrics(),
        get().fetchTranscriptions(),
        get().fetchSellers(),
        get().fetchBranches(),
      ]);

      set({ recalculating: false });
      return { success: true };
    } catch (error) {
      set({ recalculating: false });
      throw error;
    }
  },
}));

export default useStore;

