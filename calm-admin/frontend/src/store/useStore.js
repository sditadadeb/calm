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
      // Refresh the list
      get().fetchTranscriptions();
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
}));

export default useStore;

