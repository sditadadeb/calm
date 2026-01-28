import { useState, useEffect } from 'react';

const InfoIcon = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-[#1e3a5f]/20 text-[#1e3a5f] text-xs font-bold hover:bg-[#1e3a5f] hover:text-white transition-colors flex items-center justify-center"
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

// Configuración fake para demo
const FAKE_CONFIG = {
  systemPrompt: `Eres un analista experto en ventas de seguros. Tu tarea es evaluar las interacciones entre productores de seguros y clientes potenciales.

Analiza la conversación y genera un JSON con la siguiente estructura:
{
  "saleCompleted": boolean,
  "noSaleReason": "string o null",
  "productsDiscussed": ["array de productos"],
  "customerObjections": ["array de objeciones"],
  "sellerScore": number (1-10),
  "sellerStrengths": ["fortalezas"],
  "sellerWeaknesses": ["áreas de mejora"],
  "executiveSummary": "resumen breve",
  "improvementSuggestions": ["sugerencias"],
  "followUpRecommendation": "recomendación de seguimiento"
}

Criterios de puntuación:
- 1-3: No muestra interés, desconoce productos
- 4-5: Responde pero no propone activamente
- 6-7: Explica bien, intenta cerrar
- 8-9: Maneja objeciones, técnicas de venta
- 10: Cierra con cross-selling, experiencia excepcional`,
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 2000
};

const Settings = () => {
  const [config, setConfig] = useState(FAKE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Simular carga
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simular guardado
    setTimeout(() => {
      setMessage({ type: 'success', text: '¡Configuración guardada exitosamente!' });
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de restablecer el prompt al valor por defecto?')) {
      setConfig(FAKE_CONFIG);
      setMessage({ type: 'success', text: 'Prompt restablecido al valor por defecto' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Explicación de criterios */}
      <div className="bg-gradient-to-r from-[#1e3a5f]/10 to-[#2d5a87]/10 rounded-xl p-6 border border-[#1e3a5f]/20">
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center">
          Criterios de Evaluación del Score (1-10)
          <InfoIcon tooltip="El score es generado por la IA analizando múltiples factores de la conversación. Podés personalizar estos criterios modificando el prompt." />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-red-500">1-3</span>
              <span className="text-sm font-medium text-gray-600">Deficiente</span>
            </div>
            <p className="text-sm text-gray-500">No muestra interés, no conoce productos, no intenta ayudar al cliente</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-amber-500">4-5</span>
              <span className="text-sm font-medium text-gray-600">Básico</span>
            </div>
            <p className="text-sm text-gray-500">Responde preguntas pero no propone, atención pasiva</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#2d5a87]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-[#2d5a87]">6-7</span>
              <span className="text-sm font-medium text-gray-600">Bueno</span>
            </div>
            <p className="text-sm text-gray-500">Explica productos, intenta cerrar, muestra interés</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-emerald-500">8-9</span>
              <span className="text-sm font-medium text-gray-600">Excelente</span>
            </div>
            <p className="text-sm text-gray-500">Maneja objeciones, usa técnicas de venta, conoce el producto</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#1e3a5f]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-[#1e3a5f]">10</span>
              <span className="text-sm font-medium text-gray-600">Excepcional</span>
            </div>
            <p className="text-sm text-gray-500">Cierra venta con upselling/cross-selling, experiencia memorable</p>
          </div>
        </div>
      </div>

      {/* Editor de Prompt */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] p-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            Prompt del Sistema
            <InfoIcon tooltip="Este es el prompt que recibe la IA antes de analizar cada transcripción. Define cómo debe evaluar y qué estructura de respuesta debe dar." />
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt
              <InfoIcon tooltip="El System Prompt le dice a la IA quién es y cómo debe comportarse. Acá definís los criterios de evaluación y el formato de respuesta JSON." />
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              className="w-full h-64 p-4 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] resize-none"
              placeholder="Ingresá el prompt del sistema..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
                <InfoIcon tooltip="gpt-4o-mini: Rápido y económico. gpt-4o: Más preciso pero más costoso." />
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
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
                <InfoIcon tooltip="Controla la creatividad. 0 = determinístico, 1 = muy creativo. Para análisis se recomienda 0.2-0.4." />
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
                <InfoIcon tooltip="Límite máximo de tokens en la respuesta. 2000 es suficiente para análisis completos." />
              </label>
              <input
                type="number"
                min="500"
                max="4000"
                step="100"
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
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
            className="px-6 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Campos analizados */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center">
          Campos que Genera el Análisis
          <InfoIcon tooltip="Estos son los campos que la IA devuelve después de analizar cada transcripción." />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">✅</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">saleCompleted</p>
                <p className="text-xs text-gray-500">Si se concretó la venta o no (true/false)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">❌</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">noSaleReason</p>
                <p className="text-xs text-gray-500">Motivo de no venta (precio, indecisión, etc.)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📋</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">productsDiscussed</p>
                <p className="text-xs text-gray-500">Lista de productos mencionados</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🤔</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">customerObjections</p>
                <p className="text-xs text-gray-500">Objeciones planteadas por el cliente</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">💡</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">improvementSuggestions</p>
                <p className="text-xs text-gray-500">Sugerencias para mejorar la atención</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📝</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">executiveSummary</p>
                <p className="text-xs text-gray-500">Resumen ejecutivo de la interacción</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">⭐</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">sellerScore</p>
                <p className="text-xs text-gray-500">Puntuación del productor (1-10)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">💪</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">sellerStrengths</p>
                <p className="text-xs text-gray-500">Fortalezas identificadas del productor</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">sellerWeaknesses</p>
                <p className="text-xs text-gray-500">Áreas de mejora del productor</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📞</span>
              <div>
                <p className="font-medium text-sm text-[#1e3a5f]">followUpRecommendation</p>
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
