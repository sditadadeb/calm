import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getPromptConfig, updatePromptConfig, resetPromptConfig, getReanalyzeAllStreamUrl, resetAllAnalysisData } from '../api';
import { RefreshCw } from 'lucide-react';

const InfoIcon = ({ tooltip, isDark }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-[#004F9F]/20 text-[#004F9F] text-xs font-bold hover:bg-[#004F9F] hover:text-white transition-colors flex items-center justify-center"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        i
      </button>
      {showTooltip && (
        <div className={`absolute z-50 w-72 p-3 text-white text-sm rounded-lg shadow-xl -left-32 top-8 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-900 border-gray-700'}`}>
          <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent ${isDark ? 'border-b-slate-900' : 'border-b-gray-900'}`}></div>
          {tooltip}
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const { isDark } = useTheme();
  const [config, setConfig] = useState({
    systemPrompt: '',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Re-analyze state
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeProgress, setReanalyzeProgress] = useState({ current: 0, total: 0, message: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await getPromptConfig();
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePromptConfig(config);
      setMessage({ type: 'success', text: '¡Configuración guardada exitosamente!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('¿Estás seguro de restablecer el prompt al valor por defecto?')) {
      try {
        setSaving(true);
        const response = await resetPromptConfig();
        setConfig(response.data);
        setMessage({ type: 'success', text: 'Prompt restablecido al valor por defecto' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        console.error('Error resetting config:', error);
        setMessage({ type: 'error', text: 'Error al restablecer el prompt' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleReanalyzeAll = () => {
    if (!window.confirm('¿Estás seguro de re-analizar TODAS las transcripciones con el prompt actual? Esto puede tomar varios minutos.')) {
      return;
    }

    setReanalyzing(true);
    setReanalyzeProgress({ current: 0, total: 0, message: 'Iniciando...' });

    const eventSource = new EventSource(getReanalyzeAllStreamUrl());

    eventSource.addEventListener('start', (event) => {
      const data = JSON.parse(event.data);
      setReanalyzeProgress({ current: 0, total: data.total, message: data.message });
    });

    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setReanalyzeProgress({
        current: data.current,
        total: data.total,
        message: `${data.current}/${data.total} - ${data.userName}`
      });
    });

    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      eventSource.close();
      setReanalyzing(false);
      setReanalyzeProgress({ current: 0, total: 0, message: '' });
      setMessage({ 
        type: 'success', 
        text: `Re-análisis completado: ${data.success} exitosos, ${data.errors} errores` 
      });
      setTimeout(() => setMessage(null), 5000);
    });

    eventSource.addEventListener('error', (event) => {
      let errorData = null;
      try { errorData = JSON.parse(event.data); } catch(e) {}
      eventSource.close();
      setReanalyzing(false);
      setReanalyzeProgress({ current: 0, total: 0, message: '' });
      setMessage({ type: 'error', text: errorData?.message || 'Error en el re-análisis. Revisá los logs del servidor.' });
    });

    eventSource.onerror = (err) => {
      // Only show error if we haven't received a complete event
      // (connection drop after completion is not an error)
      if (reanalyzeProgress.current > 0 && reanalyzeProgress.current < reanalyzeProgress.total) {
        setMessage({ type: 'warning', text: `Conexión perdida en ${reanalyzeProgress.current}/${reanalyzeProgress.total}. El re-análisis continúa en el servidor.` });
      }
      eventSource.close();
      setReanalyzing(false);
      setReanalyzeProgress({ current: 0, total: 0, message: '' });
    };
  };

  const handleResetAllAnalysis = async () => {
    const confirmed = window.confirm(
      '¿Seguro querés borrar TODO el análisis guardado?\\n\\n' +
      'Se limpiará el análisis de transcripciones y métricas avanzadas.\\n' +
      'Después podés volver a analizar con el prompt actual.'
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      const response = await resetAllAnalysisData();
      const data = response.data || {};
      setMessage({
        type: 'success',
        text: `Análisis borrado. Transcripciones reseteadas: ${data.transcriptionsReset ?? 0}. Avanzados eliminados: ${data.advancedDeleted ?? 0}.`
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error resetting analysis:', error);
      setMessage({ type: 'error', text: 'Error al borrar análisis' });
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = `w-full p-3 rounded-lg focus:ring-2 focus:ring-[#004F9F] focus:border-transparent ${
    isDark 
      ? 'bg-slate-700 border border-slate-600 text-white' 
      : 'bg-white border border-gray-300 text-gray-800'
  }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004F9F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {message.text}
        </div>
      )}

      {/* Explicación de criterios */}
      <div className="bg-gradient-to-r from-[#004F9F]/10 to-[#003A79]/10 rounded-xl p-6 border border-[#004F9F]/20">
        <h2 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📊 Criterios de Evaluación del Score (1-10)
          <InfoIcon isDark={isDark} tooltip="El score es generado por la IA analizando múltiples factores de la atención (calidad, resolución). Podés personalizar estos criterios modificando el prompt." />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { score: '1-3', label: 'Deficiente', color: 'red', desc: 'No muestra interés, no conoce productos, no intenta ayudar al cliente' },
            { score: '4-5', label: 'Básico', color: 'yellow', desc: 'Responde preguntas pero no propone, atención pasiva' },
            { score: '6-7', label: 'Bueno', color: 'blue', desc: 'Explica productos, intenta cerrar, muestra interés' },
            { score: '8-9', label: 'Excelente', color: 'green', desc: 'Maneja objeciones, usa técnicas de venta, conoce el producto' },
            { score: '10', label: 'Excepcional', color: '#004F9F', desc: 'Cierra venta con upselling/cross-selling, experiencia memorable' },
          ].map((item) => (
            <div key={item.score} className={`rounded-lg p-4 border-l-4 ${isDark ? 'bg-slate-800' : 'bg-white'} ${
              item.color === 'red' ? 'border-l-red-400' :
              item.color === 'yellow' ? 'border-l-yellow-400' :
              item.color === 'blue' ? 'border-l-blue-400' :
              item.color === 'green' ? 'border-l-green-400' :
              'border-l-[#004F9F]'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl font-bold ${
                  item.color === 'red' ? 'text-red-400' :
                  item.color === 'yellow' ? 'text-yellow-400' :
                  item.color === 'blue' ? 'text-blue-400' :
                  item.color === 'green' ? 'text-green-400' :
                  'text-[#004F9F]'
                }`}>{item.score}</span>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{item.label}</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor de Prompt */}
      <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="bg-gradient-to-r from-[#004F9F] to-[#003A79] p-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            🤖 Prompt del Sistema
            <InfoIcon isDark={isDark} tooltip="Este es el prompt que recibe ChatGPT antes de analizar cada transcripción. Define cómo debe evaluar y qué estructura de respuesta debe dar. Modificalo con cuidado para no romper el formato JSON esperado." />
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              System Prompt
              <InfoIcon isDark={isDark} tooltip="El System Prompt le dice a la IA quién es y cómo debe comportarse. Acá definís los criterios de evaluación, el formato de respuesta JSON, y las categorías de 'motivo de no resolución'." />
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              className={`${inputClasses} h-96 font-mono text-sm`}
              placeholder="Ingresá el prompt del sistema..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                Modelo
                <InfoIcon isDark={isDark} tooltip="gpt-4o-mini: Rápido y económico. gpt-4o: Más preciso pero más costoso. gpt-4-turbo: Balance entre velocidad y precisión." />
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className={inputClasses}
              >
                <option value="gpt-5.2">gpt-5.2 (Recomendado)</option>
                <option value="gpt-5.1-chat-latest">gpt-5.1-chat-latest</option>
                <option value="gpt-4o-mini">gpt-4o-mini (Recomendado)</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                Temperatura
                <InfoIcon isDark={isDark} tooltip="Controla la creatividad de las respuestas. 0 = determinístico, 1 = muy creativo. Para análisis de atención/resolución, se recomienda 0.2-0.4 para respuestas consistentes." />
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                Max Tokens
                <InfoIcon isDark={isDark} tooltip="Límite máximo de tokens (palabras/caracteres) en la respuesta. 2000 es suficiente para análisis completos. Aumentar si las respuestas se cortan." />
              </label>
              <input
                type="number"
                min="500"
                max="4000"
                step="100"
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        <div className={`px-6 py-4 flex justify-between items-center border-t ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
          <button
            onClick={handleReset}
            disabled={saving}
            className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
          >
            Restablecer por defecto
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-[#004F9F] to-[#003A79] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Re-analizar todas las transcripciones */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          🔄 Re-analizar Transcripciones
          <InfoIcon isDark={isDark} tooltip="Después de modificar el prompt, podés re-analizar todas las transcripciones para que usen los nuevos criterios. Esto ejecutará el análisis de GPT en cada una." />
        </h2>
        
        <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Si modificaste el prompt, usá este botón para re-analizar todas las transcripciones con los nuevos criterios.
          Esto sobrescribirá los análisis anteriores.
        </p>
        
        {reanalyzing && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-5 h-5 text-[#004F9F] animate-spin" />
              <span className={isDark ? 'text-white' : 'text-gray-800'}>{reanalyzeProgress.message}</span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <div 
                className="h-full bg-gradient-to-r from-[#004F9F] to-[#003A79] transition-all duration-300"
                style={{ width: reanalyzeProgress.total > 0 ? `${(reanalyzeProgress.current / reanalyzeProgress.total) * 100}%` : '0%' }}
              />
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {reanalyzeProgress.current} de {reanalyzeProgress.total} transcripciones
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={handleReanalyzeAll}
            disabled={reanalyzing || saving}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              reanalyzing || saving
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#004F9F] to-[#003A79] text-white hover:opacity-90'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${reanalyzing ? 'animate-spin' : ''}`} />
            {reanalyzing ? 'Re-analizando...' : 'Re-analizar Todas las Transcripciones'}
          </button>

          <button
            onClick={handleResetAllAnalysis}
            disabled={reanalyzing || saving}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all ${
              reanalyzing || saving
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Borrar Todo el Análisis
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
