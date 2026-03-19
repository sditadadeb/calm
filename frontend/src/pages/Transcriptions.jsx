import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, Clock, Trash2, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import Filters from '../components/Filters';
import ScoreBadge from '../components/ScoreBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Transcriptions() {
  const {
    transcriptions,
    loading,
    recalculating,
    fetchTranscriptions,
    deleteTranscription,
    setFilters
  } = useStore();
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [deleting, setDeleting] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'recordingDate', direction: 'desc' });
  const viewMode = searchParams.get('view');
  const crossSellOnly = viewMode === 'cross-sell';
  const audioIssuesOnly = viewMode === 'audio-issues';
  const objectionOnly = viewMode === 'objection';
  const objectionParam = (searchParams.get('objection') || '').trim();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  // Función para ordenar
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Datos ordenados
  const sortedTranscriptions = useMemo(() => {
    if (!transcriptions) return [];
    
    return [...transcriptions].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];
      
      // Manejar nulls
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      
      // Comparar fechas
      if (key === 'recordingDate') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      
      // Comparar números
      if (key === 'sellerScore' || key === 'analysisConfidence') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      // Comparar booleanos
      if (key === 'saleCompleted' || key === 'analyzed' || key === 'senalesRiesgo') {
        aVal = aVal === true ? 1 : aVal === false ? 0 : -1;
        bVal = bVal === true ? 1 : bVal === false ? 0 : -1;
      }
      
      // Comparar strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transcriptions, sortConfig]);

  const normalize = (value) =>
    (value || '')
      .toString()
      .toLowerCase()
      .replaceAll('á', 'a')
      .replaceAll('é', 'e')
      .replaceAll('í', 'i')
      .replaceAll('ó', 'o')
      .replaceAll('ú', 'u')
      .trim();

  const normalizeLoose = (value) =>
    normalize(value)
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const isApiKeyPendingLabel = (value) => {
    const n = normalize(value);
    return n.includes('analisis pendiente') && n.includes('api key') && n.includes('no configurada');
  };

  const classifyBajaType = (rawValue) => {
    const norm = normalize(rawValue);
    if (!norm) return null;
    const hasBajaIntent = ['baja', 'dar de baja', 'cancel', 'cancelacion', 'cancelación'].some((term) => norm.includes(term));
    if (!hasBajaIntent) return null;

    const effectiveHints = [
      'baja efectiva',
      'baja confirmada',
      'baja realizada',
      'ya se dio de baja',
      'se dio de baja',
      'dado de baja',
      'producto dado de baja',
      'cancelado',
      'cancelada',
      'cancelacion efectiva',
      'cancelación efectiva',
    ];
    if (effectiveHints.some((hint) => norm.includes(hint))) return 'Baja efectiva';
    return 'Intención de baja';
  };

  const formatMotivoPrincipal = (value) => {
    if (isApiKeyPendingLabel(value)) return '-';
    const bajaType = classifyBajaType(value);
    if (bajaType) return bajaType;
    return value || '-';
  };

  const isCrossSellOpportunity = (transcription) => {
    let intent = '';
    try {
      const payload = transcription?.analysisPayload ? JSON.parse(transcription.analysisPayload) : {};
      const ac = payload?.analisis_contenido || {};
      intent = (
        ac.intencion_comercial_detectada ||
        ac['intención comercial detectada'] ||
        ''
      ).toString().trim();
    } catch (_) {
      intent = '';
    }
    const normalized = normalize(intent);
    return normalized && normalized !== 'ninguna';
  };

  const hasAudioIssues = (t) => {
    const text = normalize(t?.transcriptionText);
    const keywords = [
      'no se escucha',
      'no te escucho',
      'te escucho cortado',
      'se corta',
      'con interferencia',
      'mala señal',
      'se entrecorta',
      'ruido',
      'sin audio',
      'microfono',
    ];
    const byKeyword = keywords.some((k) => text.includes(k));
    const byConfidence = Number(t?.analysisConfidence || 100) < 45;
    return byKeyword || byConfidence;
  };

  const hasObjectionMatch = (transcription, objection) => {
    const target = normalizeLoose(objection);
    if (!target) return false;
    const objections = Array.isArray(transcription?.customerObjections) ? transcription.customerObjections : [];
    return objections.some((item) => {
      const current = normalizeLoose(item);
      return current && (current.includes(target) || target.includes(current));
    });
  };

  const crossSellMetaById = useMemo(() => {
    const map = new Map();
    (transcriptions || []).forEach((t) => {
      let intent = '';
      try {
        const payload = t?.analysisPayload ? JSON.parse(t.analysisPayload) : {};
        const ac = payload?.analisis_contenido || {};
        intent = (
          ac.intencion_comercial_detectada ||
          ac['intención comercial detectada'] ||
          ''
        ).toString().trim();
      } catch (_) {
        intent = '';
      }

      const normIntent = normalize(intent);
      const hasOpportunity = isCrossSellOpportunity(t);
      map.set(t.recordingId, {
        hasOpportunity,
        intentLabel: hasOpportunity ? intent : null,
      });
    });
    return map;
  }, [transcriptions]);

  const displayedTranscriptions = useMemo(() => {
    if (objectionOnly && objectionParam) {
      return sortedTranscriptions.filter((t) => hasObjectionMatch(t, objectionParam));
    }
    if (audioIssuesOnly) return sortedTranscriptions.filter((t) => hasAudioIssues(t));
    if (!crossSellOnly) return sortedTranscriptions;
    return sortedTranscriptions.filter((t) => crossSellMetaById.get(t.recordingId)?.hasOpportunity);
  }, [objectionOnly, objectionParam, audioIssuesOnly, crossSellOnly, sortedTranscriptions, crossSellMetaById]);

  const crossSellSummary = useMemo(() => {
    const source = (transcriptions || []).filter((t) => crossSellMetaById.get(t.recordingId)?.hasOpportunity);
    const byIntent = {};
    const byMotivo = {};

    source.forEach((t) => {
      const intentLabel = crossSellMetaById.get(t.recordingId)?.intentLabel || 'Oportunidad comercial';
      byIntent[intentLabel] = (byIntent[intentLabel] || 0) + 1;

      const motivo = formatMotivoPrincipal((t.motivoPrincipal || 'Sin clasificar').toString().trim());
      byMotivo[motivo] = (byMotivo[motivo] || 0) + 1;
    });

    const topIntent = Object.entries(byIntent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topMotivos = Object.entries(byMotivo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: source.length,
      topIntent,
      topMotivos,
    };
  }, [transcriptions, crossSellMetaById]);

  // Componente para header ordenable
  const SortableHeader = ({ label, sortKey, className = '' }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th 
        className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors ${isDark ? 'text-zinc-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'} ${className}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive ? (
            sortConfig.direction === 'asc' ? 
              <ChevronUp className="w-4 h-4 text-[#004F9F]" /> : 
              <ChevronDown className="w-4 h-4 text-[#004F9F]" />
          ) : (
            <ChevronsUpDown className="w-3 h-3 opacity-40" />
          )}
        </div>
      </th>
    );
  };

  useEffect(() => {
    const urlFilters = {};
    
    const userId = searchParams.get('userId');
    const branchId = searchParams.get('branchId');
    const saleCompleted = searchParams.get('saleCompleted');
    const resultadoLlamada = searchParams.get('resultadoLlamada');
    const motivoPrincipal = searchParams.get('motivoPrincipal');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');

    if (userId) urlFilters.userId = userId;
    if (branchId) urlFilters.branchId = branchId;
    if (saleCompleted !== null && saleCompleted !== '') {
      urlFilters.saleCompleted = saleCompleted === 'true';
    }
    if (resultadoLlamada) urlFilters.resultadoLlamada = resultadoLlamada;
    if (motivoPrincipal) urlFilters.motivoPrincipal = motivoPrincipal;
    if (dateFrom) urlFilters.dateFrom = dateFrom;
    if (dateTo) urlFilters.dateTo = dateTo;
    if (minScore) urlFilters.minScore = parseInt(minScore);
    if (maxScore) urlFilters.maxScore = parseInt(maxScore);

    let cancelled = false;
    const run = async () => {
      // Reset y aplica solo filtros en URL para evitar estado previo arrastrado.
      setFilters({
        userId: null,
        branchId: null,
        saleCompleted: null,
        resultadoLlamada: null,
        motivoPrincipal: null,
        dateFrom: null,
        dateTo: null,
        minScore: null,
        maxScore: null,
      });
      if (Object.keys(urlFilters).length > 0) setFilters(urlFilters);

      if (!cancelled) {
        fetchTranscriptions();
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [searchParamsKey, fetchTranscriptions, setFilters]);

  const handleDelete = async (recordingId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmed = window.confirm(
      '¿Estás seguro de eliminar esta transcripción?\n\n' +
      '⚠️ Esta acción no se puede deshacer.\n' +
      '📊 Las métricas del dashboard cambiarán al eliminar esta transcripción.'
    );
    
    if (!confirmed) return;
    
    try {
      setDeleting(recordingId);
      await deleteTranscription(recordingId);
    } catch (error) {
      alert('Error al eliminar: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: es });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de recalculando métricas */}
      {recalculating && (
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#004F9F] animate-spin" />
            <div className="flex-1">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Recalculando métricas...
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Actualizando dashboard, agentes y sucursales
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#004F9F] to-[#003A79] rounded-full animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border ${isDark ? 'text-zinc-300 bg-zinc-900 border-zinc-700' : 'text-gray-500 bg-white border-gray-200'}`}>
        <FileText className="w-4 h-4 text-[#004F9F]" />
        <span>
          {displayedTranscriptions.length} conversaciones
          {audioIssuesOnly
            ? ' con problemas de audio'
            : objectionOnly
              ? ` con objeción "${objectionParam}"`
            : crossSellOnly
              ? ' con oportunidad cross-sell'
              : ' analizadas listas para gestión comercial'}
        </span>
      </div>

      {objectionOnly && objectionParam && (
        <div className={`rounded-2xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Vista por objeción</p>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Conversaciones que contienen la objeción: <strong>{objectionParam}</strong>
              </p>
            </div>
            <Link
              to="/transcriptions"
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}

      {audioIssuesOnly && (
        <div className={`rounded-2xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Vista problemas de audio</p>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Casos detectados por menciones de corte/ruido o baja confianza del análisis.
              </p>
            </div>
            <Link
              to="/transcriptions"
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}

      {crossSellOnly && (
        <div className={`rounded-2xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Vista Cross-Sell</p>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Agrupación de conversaciones con oportunidad comercial detectada.
              </p>
            </div>
            <Link
              to="/transcriptions"
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className={`rounded-xl p-3 border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Tipos de oportunidad</p>
              {crossSellSummary.topIntent.length > 0 ? (
                <div className="space-y-2">
                  {crossSellSummary.topIntent.map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className={`text-sm truncate pr-3 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{label}</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Sin oportunidades detectadas.</p>
              )}
            </div>
            <div className={`rounded-xl p-3 border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Motivos asociados</p>
              {crossSellSummary.topMotivos.length > 0 ? (
                <div className="space-y-2">
                  {crossSellSummary.topMotivos.map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className={`text-sm truncate pr-3 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{label}</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Sin motivos relevantes.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Filters onApply={fetchTranscriptions} />

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-[#004F9F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando transcripciones...</p>
          </div>
        ) : displayedTranscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <FileText className={`w-8 h-8 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No se encontraron conversaciones</h3>
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
              {crossSellOnly
                ? 'No hay conversaciones con oportunidad cross-sell en este conjunto.'
                : audioIssuesOnly
                  ? 'No hay conversaciones con problemas de audio en este conjunto.'
                  : objectionOnly
                    ? 'No hay conversaciones con esa objeción en este conjunto.'
                : 'Intenta ajustar los filtros.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-zinc-950/90 border-b border-zinc-700' : 'bg-gray-50'}>
                <tr>
                  <SortableHeader label="ID" sortKey="recordingId" />
                  <SortableHeader label="Fecha" sortKey="recordingDate" />
                  <SortableHeader label="Motivo" sortKey="motivoPrincipal" />
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-gray-500'}`}>Cross-Sell</th>
                  <SortableHeader label="Resultado" sortKey="resultadoLlamada" />
                  <SortableHeader label="Riesgo" sortKey="senalesRiesgo" />
                  <SortableHeader label="Puntuación" sortKey="sellerScore" />
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-gray-500'}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-gray-200'}`}>
                {displayedTranscriptions.map((t, index) => (
                  <tr 
                    key={t.recordingId}
                    className={`animate-fade-in transition-colors ${isDark ? 'hover:bg-zinc-800/80' : 'hover:bg-gray-50'}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-[#004F9F]">#{t.recordingId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDate(t.recordingDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm truncate max-w-[140px] block ${isDark ? 'text-zinc-300' : 'text-gray-600'}`} title={formatMotivoPrincipal(t.motivoPrincipal)}>
                        {formatMotivoPrincipal(t.motivoPrincipal)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {crossSellMetaById.get(t.recordingId)?.hasOpportunity ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                          {crossSellMetaById.get(t.recordingId)?.intentLabel || 'Oportunidad'}
                        </span>
                      ) : (
                        <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Sin oportunidad</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {/* Resultado calidad ISL (resultadoLlamada) */}
                        {t.resultadoLlamada === 'resuelto' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3" /> Resuelto</span>
                        )}
                        {t.resultadoLlamada === 'parcial' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400"><TrendingUp className="w-3 h-3" /> Parcial</span>
                        )}
                        {t.resultadoLlamada === 'no resuelto' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" /> No resuelto</span>
                        )}
                        {t.resultadoLlamada === 'derivado' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">Derivado</span>
                        )}
                        {t.resultadoLlamada === 'falta info' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400"><HelpCircle className="w-3 h-3" /> Falta info</span>
                        )}
                        {/* Legacy: sin resultadoLlamada, usar saleStatus/saleCompleted */}
                        {!t.resultadoLlamada && t.saleCompleted === true && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3" /> Resuelto</span>
                        )}
                        {!t.resultadoLlamada && t.saleCompleted === false && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" /> No resuelto</span>
                        )}
                        {!t.resultadoLlamada && t.saleCompleted === null && !t.analyzed && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-zinc-700 text-zinc-200' : 'bg-gray-100 text-gray-500'}`}>Pendiente</span>
                        )}
                        {t.confianzaMotivo != null && (
                          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{t.confianzaMotivo}%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {t.senalesRiesgo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400" title="Señales de urgencia/riesgo"><AlertTriangle className="w-3 h-3" /> Sí</span>
                      ) : (
                        <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={t.sellerScore} size="small" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/transcriptions/${t.recordingId}`}
                          className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-lg transition-colors ${isDark ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-[#004F9F] hover:border-[#004F9F] hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#004F9F] hover:text-white'}`}
                        >
                          <Eye className="w-3 h-3" /> Ver
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDelete(t.recordingId, e)}
                            className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-lg transition-colors ${
                              deleting === t.recordingId 
                                ? 'bg-red-500/50 text-white cursor-not-allowed' 
                                : isDark 
                                  ? 'bg-zinc-800 border border-zinc-700 text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white' 
                                  : 'bg-gray-100 text-red-500 hover:bg-red-500 hover:text-white'
                            }`}
                            disabled={deleting === t.recordingId}
                            title="Eliminar transcripción"
                          >
                            <Trash2 className={`w-3 h-3 ${deleting === t.recordingId ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
