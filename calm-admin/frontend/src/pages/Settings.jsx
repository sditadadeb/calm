import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getPromptConfig, updatePromptConfig, resetPromptConfig, getReanalyzeAllStreamUrl } from '../api';
import { RefreshCw } from 'lucide-react';


const FieldCard = ({ icon, name, desc, isDark }) => (
  <div className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
    <span className="text-lg flex-shrink-0">{icon}</span>
    <div>
      <p className={`font-mono font-medium text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{name}</p>
      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{desc}</p>
    </div>
  </div>
);

const Settings = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [config, setConfig] = useState({
    systemPrompt: '',
    model: 'gpt-5.1-chat-latest',
    temperature: 0.3,
    maxTokens: 2000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
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
      setMessage({ type: 'error', text: t('settings.loadError') });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePromptConfig(config);
      setMessage({ type: 'success', text: t('settings.saveSuccess') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: t('settings.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm(t('settings.resetConfirm'))) {
      try {
        setSaving(true);
        const response = await resetPromptConfig();
        setConfig(response.data);
        setMessage({ type: 'success', text: t('settings.resetSuccess') });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        console.error('Error resetting config:', error);
        setMessage({ type: 'error', text: t('settings.resetError') });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleReanalyzeAll = () => {
    if (!window.confirm(t('settings.reanalyzeConfirm'))) {
      return;
    }

    setReanalyzing(true);
    setReanalyzeProgress({ current: 0, total: 0, message: t('settings.starting') });

    const eventSource = new EventSource(getReanalyzeAllStreamUrl());

    eventSource.addEventListener('start', (event) => {
      const data = JSON.parse(event.data);
      setReanalyzeProgress({ current: 0, total: data.total, message: 'Iniciando re-análisis...' });
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
      setMessage({ type: 'error', text: errorData?.message || 'Error durante el re-análisis' });
    });

    eventSource.onerror = (err) => {
      if (reanalyzeProgress.current > 0 && reanalyzeProgress.current < reanalyzeProgress.total) {
        setMessage({ type: 'warning', text: `Conexión interrumpida en ${reanalyzeProgress.current}/${reanalyzeProgress.total}. El proceso continúa en el servidor.` });
      }
      eventSource.close();
      setReanalyzing(false);
      setReanalyzeProgress({ current: 0, total: 0, message: '' });
    };
  };

  const inputClasses = `w-full p-3 rounded-lg focus:ring-2 focus:ring-[#0081FF] focus:border-transparent ${
    isDark 
      ? 'bg-slate-700 border border-slate-600 text-white' 
      : 'bg-white border border-gray-300 text-gray-800'
  }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0081FF]"></div>
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

      {/* Criterios de score del ejecutivo */}
      <div className="bg-gradient-to-r from-[#0081FF]/10 to-[#0862C5]/10 rounded-xl p-6 border border-[#0081FF]/20">
        <h2 className={`text-lg font-semibold mb-1 flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📊 Score del Ejecutivo — Escala 1 a 10
        </h2>
        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Evalúa la calidad de atención del oficial según el análisis de la IA sobre la transcripción.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { score: '1–3', label: 'Deficiente', color: 'red',    desc: 'No cumplió protocolos básicos. Atención inadecuada, falta de escucha o errores graves.' },
            { score: '4–5', label: 'Básico',     color: 'yellow', desc: 'Cumplimiento mínimo. Atendió la consulta pero con oportunidades claras de mejora.' },
            { score: '6–7', label: 'Bueno',      color: 'blue',   desc: 'Atención correcta. Siguió el protocolo con algunas áreas de mejora menores.' },
            { score: '8–9', label: 'Excelente',  color: 'green',  desc: 'Alto cumplimiento. Escucha activa, oferta de productos y buen cierre de la interacción.' },
            { score: '10',  label: 'Excepcional',color: 'purple', desc: 'Atención ejemplar. Referente para el equipo. Cumplimiento total y experiencia sobresaliente.' },
          ].map((item) => (
            <div key={item.score} className={`rounded-lg p-4 border-l-4 ${isDark ? 'bg-slate-800' : 'bg-white'} ${
              item.color === 'red'    ? 'border-l-red-400' :
              item.color === 'yellow' ? 'border-l-yellow-400' :
              item.color === 'blue'   ? 'border-l-[#0081FF]' :
              item.color === 'green'  ? 'border-l-green-400' :
              'border-l-purple-400'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl font-bold ${
                  item.color === 'red'    ? 'text-red-400' :
                  item.color === 'yellow' ? 'text-yellow-400' :
                  item.color === 'blue'   ? 'text-[#0081FF]' :
                  item.color === 'green'  ? 'text-green-400' :
                  'text-purple-400'
                }`}>{item.score}</span>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{item.label}</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor de Prompt */}
      <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="bg-gradient-to-r from-[#0081FF] to-[#0862C5] p-4">
          <h2 className="text-lg font-semibold text-white">
            🤖 Prompt del Sistema — Instrucciones para la IA
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Define cómo la IA analiza cada atención. Adaptado para Banco de Occidente.
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              System Prompt
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              className={`${inputClasses} h-96 font-mono text-sm`}
              placeholder={t('settings.promptPlaceholder')}
            />
          </div>

          {/* Nota sobre re-análisis */}
          <p className={`text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
            ℹ️ Cambiar el modelo o el prompt NO re-analiza automáticamente las transcripciones existentes. Usá el botón "Re-analizar" abajo para aplicarlo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {t('settings.model')}
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className={inputClasses}
              >
                <optgroup label="── GPT-5.4 (Actual)">
                  <option value="gpt-5.4-mini">gpt-5.4-mini — Recomendado (calidad + costo)</option>
                  <option value="gpt-5.4">gpt-5.4 — Máxima inteligencia</option>
                  <option value="gpt-5.4-nano">gpt-5.4-nano — Más rápido y barato</option>
                </optgroup>
                <optgroup label="── GPT-5.3 / GPT-5.2">
                  <option value="gpt-5.3-chat-latest">gpt-5.3-instant — Conversacional rápido</option>
                  <option value="gpt-5.2">gpt-5.2 — Razonamiento configurable</option>
                  <option value="gpt-5.2-chat-latest">gpt-5.2-chat — Anterior ChatGPT</option>
                </optgroup>
                <optgroup label="── GPT-5.1 (Deprecated)">
                  <option value="gpt-5.1">gpt-5.1 — Coding + agentes</option>
                </optgroup>
                <optgroup label="── GPT-4.1 (Legacy)">
                  <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                </optgroup>
              </select>
            </div>

          </div>
        </div>

        <div className={`px-6 py-4 flex justify-between items-center border-t ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
          <button
            onClick={handleReset}
            disabled={saving}
            className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
          >
            {t('settings.resetDefault')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-[#0081FF] to-[#0862C5] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
          >
            {saving ? t('settings.saving') : t('settings.saveChanges')}
          </button>
        </div>
      </div>

      {/* Re-analizar todas las transcripciones */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          🔄 Re-analizar Transcripciones con IA
        </h2>
        
        <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Si modificaste el prompt, usá este botón para re-analizar todas las transcripciones con los nuevos criterios. Sobrescribirá los análisis anteriores.
        </p>
        
        {reanalyzing && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-5 h-5 text-[#0081FF] animate-spin" />
              <span className={isDark ? 'text-white' : 'text-gray-800'}>{reanalyzeProgress.message}</span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <div 
                className="h-full bg-gradient-to-r from-[#0081FF] to-[#0862C5] transition-all duration-300"
                style={{ width: reanalyzeProgress.total > 0 ? `${(reanalyzeProgress.current / reanalyzeProgress.total) * 100}%` : '0%' }}
              />
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {reanalyzeProgress.current} de {reanalyzeProgress.total} transcripciones
            </p>
          </div>
        )}
        
        <button
          onClick={handleReanalyzeAll}
          disabled={reanalyzing || saving}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            reanalyzing || saving
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#0081FF] to-[#0862C5] text-white hover:opacity-90'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${reanalyzing ? 'animate-spin' : ''}`} />
          {reanalyzing ? t('settings.reanalyzing') : t('settings.reanalyzeAll')}
        </button>
      </div>

      {/* Campos analizados */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📋 Campos que genera el análisis de IA
        </h2>
        <p className={`text-sm mb-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Estos son los datos que la IA extrae de cada transcripción para Banco de Occidente.
        </p>

        {/* Tipificación */}
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Tipificación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {[
            { icon: '🏷️', name: 'motivoVisita',    desc: 'Motivo principal de la visita del cliente (apertura de cuenta, crédito, reclamo, etc.)' },
            { icon: '😊', name: 'estadoEmocional', desc: 'Estado emocional predominante del cliente: Positivo, Neutro o Negativo.' },
          ].map(f => <FieldCard key={f.name} {...f} isDark={isDark} />)}
        </div>

        {/* Calidad de servicio */}
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Calidad de Servicio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {[
            { icon: '⭐', name: 'csatScore',            desc: 'Satisfacción estimada del cliente: escala 1–5. 0 = sin evidencia.' },
            { icon: '👂', name: 'escuchaActivaScore',   desc: 'Calidad de escucha activa del oficial: escala 1–10.' },
            { icon: '📋', name: 'cumplimientoProtocolo',desc: 'true si el oficial siguió el protocolo de atención (saludo, identificación, resolución, despedida).' },
            { icon: '📊', name: 'protocoloScore',       desc: 'Puntaje 0–100 de qué tan bien se siguió el protocolo de atención.' },
            { icon: '💬', name: 'sellerScore',          desc: 'Score general del ejecutivo 1–10 según calidad total de la atención.' },
            { icon: '💪', name: 'sellerStrengths',      desc: 'Lista de fortalezas observadas en la atención del oficial.' },
            { icon: '⚠️', name: 'sellerWeaknesses',     desc: 'Lista de debilidades o áreas de mejora identificadas.' },
            { icon: '💡', name: 'improvementSuggestions', desc: 'Sugerencias concretas para mejorar la calidad de atención.' },
          ].map(f => <FieldCard key={f.name} {...f} isDark={isDark} />)}
        </div>

        {/* Efectividad comercial */}
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Efectividad Comercial
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {[
            { icon: '💰', name: 'productoOfrecido',       desc: 'true si el oficial ofreció activamente algún producto o servicio bancario.' },
            { icon: '🏦', name: 'saleStatus',             desc: 'Estado: SALE_CONFIRMED / SALE_LIKELY / ADVANCE_NO_CLOSE / NO_SALE / UNINTERPRETABLE.' },
            { icon: '✅', name: 'saleCompleted',          desc: 'true solo si saleStatus = SALE_CONFIRMED (venta/producto confirmado).' },
            { icon: '📜', name: 'saleEvidence',           desc: 'Cita textual exacta que evidencia la venta o avance comercial.' },
            { icon: '💵', name: 'montoOfrecido',          desc: 'Monto en pesos colombianos del crédito/préstamo ofrecido. null si no aplica.' },
            { icon: '📐', name: 'cumplimientoLineamiento',desc: 'true si el monto ofrecido cumple o supera el lineamiento del banco.' },
            { icon: '🛒', name: 'productsDiscussed',      desc: 'Lista de productos bancarios mencionados en la conversación.' },
            { icon: '🤔', name: 'customerObjections',     desc: 'Objeciones o dudas planteadas por el cliente.' },
          ].map(f => <FieldCard key={f.name} {...f} isDark={isDark} />)}
        </div>

        {/* Grabación y consentimiento */}
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Grabación y Consentimiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {[
            { icon: '🔴', name: 'grabacionCortadaCliente', desc: 'true si el cliente solicitó no ser grabado o pidió detener la grabación.' },
            { icon: '✂️', name: 'grabacionCortadaManual',  desc: 'true si el oficial finalizó la grabación manualmente sin solicitud del cliente.' },
          ].map(f => <FieldCard key={f.name} {...f} isDark={isDark} />)}
        </div>

        {/* Análisis general */}
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Análisis General
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: '📊', name: 'analysisConfidence', desc: 'Calidad del input 0–100: qué tan analizable fue la transcripción (ruido, coherencia, usabilidad).' },
            { icon: '📝', name: 'executiveSummary',   desc: 'Resumen factual en 2–3 oraciones: qué consultó el cliente, qué se ofreció, qué se resolvió.' },
            { icon: '🔁', name: 'followUpRecommendation', desc: 'Recomendación de seguimiento post-atención si aplica.' },
            { icon: '❌', name: 'noSaleReason',       desc: 'Motivo principal por el que no se concretó una venta/producto (si aplica).' },
          ].map(f => <FieldCard key={f.name} {...f} isDark={isDark} />)}
        </div>
      </div>
    </div>
  );
};

export default Settings;
