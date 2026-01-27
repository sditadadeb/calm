import { useState, useEffect } from 'react';
import { getPromptConfig, updatePromptConfig, resetPromptConfig } from '../api';

const InfoIcon = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-calm-primary/20 text-calm-primary text-xs font-bold hover:bg-calm-primary hover:text-white transition-colors flex items-center justify-center"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        i
      </button>
      {showTooltip && (
        <div className="absolute z-50 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl -left-32 top-8">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900"></div>
          {tooltip}
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const [config, setConfig] = useState({
    systemPrompt: '',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-calm-text-dark">Configuración de Análisis IA</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Explicación de criterios */}
      <div className="bg-gradient-to-r from-calm-primary/10 to-calm-secondary/10 rounded-xl p-6 border border-calm-primary/20">
        <h2 className="text-lg font-semibold text-calm-text-dark mb-4 flex items-center">
          📊 Criterios de Evaluación del Score (1-10)
          <InfoIcon tooltip="El score es generado por la IA analizando múltiples factores de la conversación de venta. Podés personalizar estos criterios modificando el prompt." />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-red-500">1-3</span>
              <span className="text-sm font-medium text-gray-600">Deficiente</span>
            </div>
            <p className="text-sm text-gray-500">No muestra interés, no conoce productos, no intenta ayudar al cliente</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-yellow-500">4-5</span>
              <span className="text-sm font-medium text-gray-600">Básico</span>
            </div>
            <p className="text-sm text-gray-500">Responde preguntas pero no propone, atención pasiva</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-blue-500">6-7</span>
              <span className="text-sm font-medium text-gray-600">Bueno</span>
            </div>
            <p className="text-sm text-gray-500">Explica productos, intenta cerrar, muestra interés</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-green-500">8-9</span>
              <span className="text-sm font-medium text-gray-600">Excelente</span>
            </div>
            <p className="text-sm text-gray-500">Maneja objeciones, usa técnicas de venta, conoce el producto</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-calm-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-calm-primary">10</span>
              <span className="text-sm font-medium text-gray-600">Excepcional</span>
            </div>
            <p className="text-sm text-gray-500">Cierra venta con upselling/cross-selling, experiencia memorable</p>
          </div>
        </div>
      </div>

      {/* Editor de Prompt */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-calm-primary to-calm-secondary p-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            🤖 Prompt del Sistema
            <InfoIcon tooltip="Este es el prompt que recibe ChatGPT antes de analizar cada transcripción. Define cómo debe evaluar y qué estructura de respuesta debe dar. Modificalo con cuidado para no romper el formato JSON esperado." />
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt
              <InfoIcon tooltip="El System Prompt le dice a la IA quién es y cómo debe comportarse. Acá definís los criterios de evaluación, el formato de respuesta JSON, y las categorías de 'razón de no venta'." />
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              className="w-full h-96 p-4 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-calm-primary focus:border-calm-primary"
              placeholder="Ingresá el prompt del sistema..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
                <InfoIcon tooltip="gpt-4o-mini: Rápido y económico. gpt-4o: Más preciso pero más costoso. gpt-4-turbo: Balance entre velocidad y precisión." />
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-calm-primary focus:border-calm-primary"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Recomendado)</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperatura
                <InfoIcon tooltip="Controla la creatividad de las respuestas. 0 = determinístico, 1 = muy creativo. Para análisis de ventas, se recomienda 0.2-0.4 para respuestas consistentes." />
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-calm-primary focus:border-calm-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
                <InfoIcon tooltip="Límite máximo de tokens (palabras/caracteres) en la respuesta. 2000 es suficiente para análisis completos. Aumentar si las respuestas se cortan." />
              </label>
              <input
                type="number"
                min="500"
                max="4000"
                step="100"
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-calm-primary focus:border-calm-primary"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Restablecer por defecto
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-calm-primary to-calm-secondary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Campos analizados */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-calm-text-dark mb-4 flex items-center">
          📋 Campos que Genera el Análisis
          <InfoIcon tooltip="Estos son los campos que la IA devuelve después de analizar cada transcripción. Si modificás el prompt, asegurate de mantener esta estructura JSON." />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">✅</span>
              <div>
                <p className="font-medium text-sm">saleCompleted</p>
                <p className="text-xs text-gray-500">Si se concretó la venta o no (true/false)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">❌</span>
              <div>
                <p className="font-medium text-sm">noSaleReason</p>
                <p className="text-xs text-gray-500">Motivo de no venta (precio, indecisión, etc.)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🛏️</span>
              <div>
                <p className="font-medium text-sm">productsDiscussed</p>
                <p className="text-xs text-gray-500">Lista de productos mencionados</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🤔</span>
              <div>
                <p className="font-medium text-sm">customerObjections</p>
                <p className="text-xs text-gray-500">Objeciones planteadas por el cliente</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">💡</span>
              <div>
                <p className="font-medium text-sm">improvementSuggestions</p>
                <p className="text-xs text-gray-500">Sugerencias para mejorar la atención</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📝</span>
              <div>
                <p className="font-medium text-sm">executiveSummary</p>
                <p className="text-xs text-gray-500">Resumen ejecutivo de la interacción</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">⭐</span>
              <div>
                <p className="font-medium text-sm">sellerScore</p>
                <p className="text-xs text-gray-500">Puntuación del vendedor (1-10)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">💪</span>
              <div>
                <p className="font-medium text-sm">sellerStrengths</p>
                <p className="text-xs text-gray-500">Fortalezas identificadas del vendedor</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-medium text-sm">sellerWeaknesses</p>
                <p className="text-xs text-gray-500">Áreas de mejora del vendedor</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📞</span>
              <div>
                <p className="font-medium text-sm">followUpRecommendation</p>
                <p className="text-xs text-gray-500">Recomendación de seguimiento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

