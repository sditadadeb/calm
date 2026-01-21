import { create } from 'zustand';
import api from '../api/axios';

const useSurveyStore = create((set, get) => ({
  surveys: [],
  currentSurvey: null,
  loading: false,
  error: null,

  fetchSurveys: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/surveys');
      set({ surveys: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar encuestas', loading: false });
    }
  },

  fetchSurvey: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/surveys/${id}`);
      set({ currentSurvey: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar encuesta', loading: false });
      return null;
    }
  },

  createSurvey: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/surveys', data);
      set(state => ({ 
        surveys: [response.data, ...state.surveys],
        currentSurvey: response.data,
        loading: false 
      }));
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al crear encuesta', loading: false });
      return { success: false };
    }
  },

  updateSurvey: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/surveys/${id}`, data);
      set(state => ({
        surveys: state.surveys.map(s => s.id === id ? response.data : s),
        currentSurvey: response.data,
        loading: false
      }));
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al actualizar encuesta', loading: false });
      return { success: false };
    }
  },

  publishSurvey: async (id) => {
    try {
      const response = await api.post(`/surveys/${id}/publish`);
      set(state => ({
        surveys: state.surveys.map(s => s.id === id ? response.data : s),
        currentSurvey: state.currentSurvey?.id === id ? response.data : state.currentSurvey
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  closeSurvey: async (id) => {
    try {
      const response = await api.post(`/surveys/${id}/close`);
      set(state => ({
        surveys: state.surveys.map(s => s.id === id ? response.data : s),
        currentSurvey: state.currentSurvey?.id === id ? response.data : state.currentSurvey
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  deleteSurvey: async (id) => {
    try {
      await api.delete(`/surveys/${id}`);
      set(state => ({
        surveys: state.surveys.filter(s => s.id !== id),
        currentSurvey: state.currentSurvey?.id === id ? null : state.currentSurvey
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  addQuestion: async (surveyId, questionData) => {
    try {
      const response = await api.post(`/surveys/${surveyId}/questions`, questionData);
      set(state => {
        if (state.currentSurvey?.id === surveyId) {
          return {
            currentSurvey: {
              ...state.currentSurvey,
              questions: [...(state.currentSurvey.questions || []), response.data]
            }
          };
        }
        return state;
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  updateQuestion: async (questionId, questionData) => {
    try {
      const numericId = typeof questionId === 'string' ? parseInt(questionId, 10) : questionId;
      // Asegurar que el tipo de pregunta se mantenga si no se especifica
      const payload = {
        text: questionData.text,
        type: questionData.type,
        required: questionData.required || false,
        description: questionData.description,
        options: questionData.options?.map((opt, idx) => ({
          text: opt.text,
          value: opt.value || opt.text,
          orderIndex: idx
        }))
      };
      const response = await api.put(`/surveys/questions/${numericId}`, payload);
      set(state => {
        if (state.currentSurvey) {
          return {
            currentSurvey: {
              ...state.currentSurvey,
              questions: state.currentSurvey.questions.map(q => 
                q.id === numericId ? response.data : q
              )
            }
          };
        }
        return state;
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating question:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Error al actualizar pregunta' };
    }
  },

  deleteQuestion: async (questionId) => {
    try {
      const numericId = typeof questionId === 'string' ? parseInt(questionId, 10) : questionId;
      await api.delete(`/surveys/questions/${numericId}`);
      set(state => {
        if (state.currentSurvey) {
          return {
            currentSurvey: {
              ...state.currentSurvey,
              questions: state.currentSurvey.questions.filter(q => q.id !== numericId)
            }
          };
        }
        return state;
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting question:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Error al eliminar pregunta' };
    }
  },

  reorderQuestions: async (surveyId, questionIds) => {
    try {
      await api.put(`/surveys/${surveyId}/questions/reorder`, questionIds);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  clearCurrentSurvey: () => set({ currentSurvey: null }),
}));

export default useSurveyStore;

