import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getPromptConfig, updatePromptConfig, resetPromptConfig, getReanalyzeAllStreamUrl } from '../api';
import { RefreshCw } from 'lucide-react';

const InfoIcon = ({ tooltip, isDark }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#F5A623] text-xs font-bold hover:bg-[#F5A623] hover:text-white transition-colors flex items-center justify-center"
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
      setMessage({ type: 'error', text: t('settings.errorLoading') });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePromptConfig(config);
      setMessage({ type: 'success', text: t('settings.savedSuccess') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: t('settings.errorSaving') });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm(t('settings.confirmReset'))) {
      try {
        setSaving(true);
        const response = await resetPromptConfig();
        setConfig(response.data);
        setMessage({ type: 'success', text: t('settings.resetSuccess') });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        console.error('Error resetting config:', error);
        setMessage({ type: 'error', text: t('settings.errorReset') });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleReanalyzeAll = () => {
    if (!window.confirm(t('settings.confirmReanalyze'))) {
      return;
    }

    setReanalyzing(true);
    setReanalyzeProgress({ current: 0, total: 0, message: t('settings.starting') });

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
        text: `${t('settings.reanalyzeComplete')}: ${data.success} ${t('settings.successful')}, ${data.errors} ${t('settings.errors')}` 
      });
      setTimeout(() => setMessage(null), 5000);
    });

    eventSource.addEventListener('error', (event) => {
      let errorData = null;
      try { errorData = JSON.parse(event.data); } catch(e) {}
      eventSource.close();
      setReanalyzing(false);
      setReanalyzeProgress({ current: 0, total: 0, message: '' });
      setMessage({ type: 'error', text: errorData?.message || t('settings.reanalyzeError') });
    });

    eventSource.onerror = (err) => {
      if (reanalyzeProgress.current > 0 && reanalyzeProgress.current < reanalyzeProgress.total) {
        setMessage({ type: 'warning', text: `${t('settings.connectionLost')} ${reanalyzeProgress.current}/${reanalyzeProgress.total}. ${t('settings.continuesOnServer')}` });
      }
      eventSource.close();
      setReanalyzing(false);
      setReanalyzeProgress({ current: 0, total: 0, message: '' });
    };
  };

  const inputClasses = `w-full p-3 rounded-lg focus:ring-2 focus:ring-[#F5A623] focus:border-transparent ${
    isDark 
      ? 'bg-slate-700 border border-slate-600 text-white' 
      : 'bg-white border border-gray-300 text-gray-800'
  }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623]"></div>
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
      <div className="bg-gradient-to-r from-[#F5A623]/10 to-[#FFBB54]/10 rounded-xl p-6 border border-[#F5A623]/20">
        <h2 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📊 {t('settings.scoreCriteria')}
          <InfoIcon isDark={isDark} tooltip={t('settings.scoreCriteriaTooltip')} />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { score: '1-3', label: t('settings.deficient'), color: 'red', desc: t('settings.deficientDesc') },
            { score: '4-5', label: t('settings.basic'), color: 'yellow', desc: t('settings.basicDesc') },
            { score: '6-7', label: t('settings.good'), color: 'blue', desc: t('settings.goodDesc') },
            { score: '8-9', label: t('settings.excellent'), color: 'green', desc: t('settings.excellentDesc') },
            { score: '10', label: t('settings.exceptional'), color: 'orange', desc: t('settings.exceptionalDesc') },
          ].map((item) => (
            <div key={item.score} className={`rounded-lg p-4 border-l-4 ${isDark ? 'bg-slate-800' : 'bg-white'} ${
              item.color === 'red' ? 'border-l-red-400' :
              item.color === 'yellow' ? 'border-l-yellow-400' :
              item.color === 'blue' ? 'border-l-blue-400' :
              item.color === 'green' ? 'border-l-green-400' :
              'border-l-[#F5A623]'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl font-bold ${
                  item.color === 'red' ? 'text-red-400' :
                  item.color === 'yellow' ? 'text-yellow-400' :
                  item.color === 'blue' ? 'text-blue-400' :
                  item.color === 'green' ? 'text-green-400' :
                  'text-[#F5A623]'
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
        <div className="bg-gradient-to-r from-[#F5A623] to-[#FFBB54] p-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            🤖 {t('settings.systemPrompt')}
            <InfoIcon isDark={isDark} tooltip={t('settings.systemPromptTooltip')} />
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              System Prompt
              <InfoIcon isDark={isDark} tooltip={t('settings.systemPromptFieldTooltip')} />
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              className={`${inputClasses} h-96 font-mono text-sm`}
              placeholder={t('settings.promptPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {t('settings.model')}
                <InfoIcon isDark={isDark} tooltip={t('settings.modelTooltip')} />
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className={inputClasses}
              >
                <option value="gpt-5.1-chat-latest">gpt-5.1-instant ({t('settings.recommended')})</option>
                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {t('settings.temperature')}
                <InfoIcon isDark={isDark} tooltip={t('settings.temperatureTooltip')} />
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
                <InfoIcon isDark={isDark} tooltip={t('settings.maxTokensTooltip')} />
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
            {t('settings.resetDefault')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
          >
            {saving ? t('settings.saving') : t('settings.saveChanges')}
          </button>
        </div>
      </div>

      {/* Re-analizar todas las transcripciones */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          🔄 {t('settings.reanalyzeTitle')}
          <InfoIcon isDark={isDark} tooltip={t('settings.reanalyzeTooltip')} />
        </h2>
        
        <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          {t('settings.reanalyzeDesc')}
        </p>
        
        {reanalyzing && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-5 h-5 text-[#F5A623] animate-spin" />
              <span className={isDark ? 'text-white' : 'text-gray-800'}>{reanalyzeProgress.message}</span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <div 
                className="h-full bg-gradient-to-r from-[#F5A623] to-[#FFBB54] transition-all duration-300"
                style={{ width: reanalyzeProgress.total > 0 ? `${(reanalyzeProgress.current / reanalyzeProgress.total) * 100}%` : '0%' }}
              />
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {reanalyzeProgress.current} {t('settings.of')} {reanalyzeProgress.total} {t('settings.transcriptions')}
            </p>
          </div>
        )}
        
        <button
          onClick={handleReanalyzeAll}
          disabled={reanalyzing || saving}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            reanalyzing || saving
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white hover:opacity-90'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${reanalyzing ? 'animate-spin' : ''}`} />
          {reanalyzing ? t('settings.reanalyzing') : t('settings.reanalyzeAll')}
        </button>
      </div>

      {/* Campos analizados */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📋 {t('settings.analysisFields')}
          <InfoIcon isDark={isDark} tooltip={t('settings.analysisFieldsTooltip')} />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '✅', name: 'saleCompleted', desc: t('settings.field.saleCompleted') },
            { icon: '🏷️', name: 'saleStatus', desc: t('settings.field.saleStatus') },
            { icon: '📊', name: 'analysisConfidence', desc: t('settings.field.analysisConfidence') },
            { icon: '📜', name: 'saleEvidence', desc: t('settings.field.saleEvidence') },
            { icon: '❌', name: 'noSaleReason', desc: t('settings.field.noSaleReason') },
            { icon: '🛏️', name: 'productsDiscussed', desc: t('settings.field.productsDiscussed') },
            { icon: '🤔', name: 'customerObjections', desc: t('settings.field.customerObjections') },
            { icon: '💡', name: 'improvementSuggestions', desc: t('settings.field.improvementSuggestions') },
            { icon: '📝', name: 'executiveSummary', desc: t('settings.field.executiveSummary') },
            { icon: '⭐', name: 'sellerScore', desc: t('settings.field.sellerScore') },
            { icon: '💪', name: 'sellerStrengths', desc: t('settings.field.sellerStrengths') },
            { icon: '⚠️', name: 'sellerWeaknesses', desc: t('settings.field.sellerWeaknesses') },
          ].map((field) => (
            <div key={field.name} className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <span className="text-lg">{field.icon}</span>
              <div>
                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{field.name}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{field.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
