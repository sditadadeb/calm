import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, Sparkles, Clock, Trash2, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Filters from '../components/Filters';
import ScoreBadge from '../components/ScoreBadge';
import { checkNewTranscriptions } from '../api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Transcriptions() {
  const { transcriptions, loading, recalculating, fetchTranscriptions, analyzeTranscription, deleteTranscription, setFilters, filters } = useStore();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [deleting, setDeleting] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'recordingDate', direction: 'desc' });
  const [syncing, setSyncing] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  // Función para ordenar
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filtrado client-side
  const filteredTranscriptions = useMemo(() => {
    if (!transcriptions) return [];
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    return transcriptions.filter(t => {
      if (currentUser.sellerId && String(t.userId) !== String(currentUser.sellerId)) return false;
      // Filtro por vendedor (del panel de filtros)
      if (filters.userId && String(t.userId) !== String(filters.userId)) return false;
      // Filtro por sucursal
      if (filters.branchId && String(t.branchId) !== String(filters.branchId)) return false;
      // Filtro por estado de venta (saleStatus)
      if (filters.saleStatus && t.saleStatus !== filters.saleStatus) return false;
      // Filtro por fecha desde
      if (filters.dateFrom && t.recordingDate) {
        const recDate = new Date(t.recordingDate).toISOString().slice(0, 10);
        if (recDate < filters.dateFrom) return false;
      }
      // Filtro por fecha hasta
      if (filters.dateTo && t.recordingDate) {
        const recDate = new Date(t.recordingDate).toISOString().slice(0, 10);
        if (recDate > filters.dateTo) return false;
      }
      // Filtro por puntuación mínima
      if (filters.minScore && (t.sellerScore === null || t.sellerScore === undefined || t.sellerScore < Number(filters.minScore))) return false;
      // Filtro por puntuación máxima
      if (filters.maxScore && (t.sellerScore === null || t.sellerScore === undefined || t.sellerScore > Number(filters.maxScore))) return false;
      return true;
    });
  }, [transcriptions, filters]);

  // Datos ordenados
  const sortedTranscriptions = useMemo(() => {
    if (!filteredTranscriptions) return [];
    
    return [...filteredTranscriptions].sort((a, b) => {
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
      if (key === 'saleCompleted' || key === 'analyzed') {
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
  }, [filteredTranscriptions, sortConfig]);

  // Componente para header ordenable
  const SortableHeader = ({ label, sortKey, className = '' }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th 
        className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none hover:bg-opacity-80 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} ${className}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive ? (
            sortConfig.direction === 'asc' ? 
              <ChevronUp className="w-4 h-4 text-[#0081FF]" /> : 
              <ChevronDown className="w-4 h-4 text-[#0081FF]" />
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
    const saleStatus = searchParams.get('saleStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');

    if (userId) urlFilters.userId = userId;
    if (branchId) urlFilters.branchId = branchId;
    if (saleStatus) urlFilters.saleStatus = saleStatus;
    if (dateFrom) urlFilters.dateFrom = dateFrom;
    if (dateTo) urlFilters.dateTo = dateTo;
    if (minScore) urlFilters.minScore = parseInt(minScore);
    if (maxScore) urlFilters.maxScore = parseInt(maxScore);

    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
    
    // Cargar lista inmediatamente sin esperar el sync
    fetchTranscriptions();

    // Sync en background: al entrar y cada 2 min mientras la página esté abierta.
    const COOLDOWN_MS = 2 * 60 * 1000;
    const runAutoCheck = () => {
      const lastCheck = parseInt(localStorage.getItem('lastS3Check') || '0', 10);
      const shouldCheck = (Date.now() - lastCheck) >= COOLDOWN_MS;

      if (isAdmin && shouldCheck) {
        setSyncing(true);
        checkNewTranscriptions()
          .then(() => {
            localStorage.setItem('lastS3Check', String(Date.now()));
            fetchTranscriptions();
          })
          .catch(err => console.error('Auto-check failed:', err))
          .finally(() => setSyncing(false));
      }
    };

    runAutoCheck();
    const intervalId = window.setInterval(runAutoCheck, COOLDOWN_MS);
    return () => window.clearInterval(intervalId);
  }, [searchParams, isAdmin, fetchTranscriptions, setFilters]);

  const handleAnalyze = async (recordingId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await analyzeTranscription(recordingId);
    } catch (error) {
      alert('Error al analizar: ' + error.message);
    }
  };

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
            <RefreshCw className="w-5 h-5 text-[#0081FF] animate-spin" />
            <div className="flex-1">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {t('transcriptions.recalculating')}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('transcriptions.updatingDashboard')}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#0081FF] to-[#0862C5] rounded-full animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        {syncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-[#0081FF]" />
            <span>{t('transcriptions.checkingNew')}</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>{filteredTranscriptions.length} {t('common.of')} {transcriptions.length} {t('common.records')}</span>
          </>
        )}
      </div>

      {/* Filters - client-side, no need to re-fetch */}
      <Filters />

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-[#0081FF] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('transcriptions.loadingTranscriptions')}</p>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <FileText className={`w-8 h-8 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('transcriptions.noTranscriptions')}</h3>
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('transcriptions.adjustFilters')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  <SortableHeader label={t('transcriptions.id')} sortKey="recordingId" />
                  <SortableHeader label={t('transcriptions.seller')} sortKey="userName" />
                  <SortableHeader label={t('transcriptions.branch')} sortKey="branchName" />
                  <SortableHeader label={t('transcriptions.date')} sortKey="recordingDate" />
                  <SortableHeader label={t('transcriptions.result')} sortKey="saleCompleted" />
                  <SortableHeader label={t('transcriptions.score')} sortKey="sellerScore" />
                  <SortableHeader label={t('transcriptions.status')} sortKey="analyzed" />
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {sortedTranscriptions.map((transcription, index) => (
                  <tr 
                    key={transcription.recordingId}
                    className={`animate-fade-in transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-[#0081FF]">#{transcription.recordingId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{transcription.userName || t('common.unknown')}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>ID: {transcription.userId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`capitalize ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{transcription.branchName || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDate(transcription.recordingDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {/* Sale Status Badge */}
                        {transcription.saleStatus === 'SALE_CONFIRMED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400" title={t('transcriptions.saleConfirmed')}>
                            <CheckCircle className="w-3 h-3" /> {t('transcriptions.sale')}
                          </span>
                        )}
                        {transcription.saleStatus === 'SALE_LIKELY' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400" title={t('transcriptions.saleProbable')}>
                            <TrendingUp className="w-3 h-3" /> {t('transcriptions.probable')}
                          </span>
                        )}
                        {transcription.saleStatus === 'ADVANCE_NO_CLOSE' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400" title={t('transcriptions.advanceNoClose')}>
                            <AlertTriangle className="w-3 h-3" /> {t('transcriptions.advance')}
                          </span>
                        )}
                        {transcription.saleStatus === 'NO_SALE' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400" title={t('transcriptions.noSaleResult')}>
                            <XCircle className="w-3 h-3" /> {t('transcriptions.noSale')}
                          </span>
                        )}
                        {transcription.saleStatus === 'UNINTERPRETABLE' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400" title={t('transcriptions.uninterpretable')}>
                            <HelpCircle className="w-3 h-3" /> {t('transcriptions.notInterp')}
                          </span>
                        )}
                        {/* Fallback para transcripciones sin saleStatus */}
                        {!transcription.saleStatus && transcription.saleCompleted === true && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                            <CheckCircle className="w-3 h-3" /> {t('transcriptions.sale')}
                          </span>
                        )}
                        {!transcription.saleStatus && transcription.saleCompleted === false && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
                            <XCircle className="w-3 h-3" /> {t('transcriptions.noSale')}
                          </span>
                        )}
                        {!transcription.saleStatus && transcription.saleCompleted === null && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-500'}`}>
                            {t('transcriptions.pending')}
                          </span>
                        )}
                        {/* Confidence indicator */}
                        {transcription.analysisConfidence !== null && transcription.analysisConfidence !== undefined && (
                          <div className="flex items-center gap-1" title={`Confianza: ${transcription.analysisConfidence}%`}>
                            <div className={`h-1 w-12 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-full rounded-full ${
                                  transcription.analysisConfidence >= 70 ? 'bg-green-500' : 
                                  transcription.analysisConfidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${transcription.analysisConfidence}%` }}
                              />
                            </div>
                            <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {transcription.analysisConfidence}%
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={transcription.sellerScore} size="small" />
                    </td>
                    <td className="px-6 py-4">
                      {transcription.analyzed ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> {t('transcriptions.analyzed')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-400 text-xs font-medium">
                          <Sparkles className="w-3 h-3" /> {t('transcriptions.pending')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/transcriptions/${transcription.recordingId}`}
                          className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-[#0081FF] hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#0081FF] hover:text-white'}`}
                        >
                          <Eye className="w-3 h-3" /> {t('common.view')}
                        </Link>
                        {isAdmin && !transcription.analyzed && (
                          <button
                            onClick={(e) => handleAnalyze(transcription.recordingId, e)}
                            className="text-xs py-2 px-3 inline-flex items-center gap-1 bg-gradient-to-r from-[#0081FF] to-[#0862C5] text-white rounded-lg hover:opacity-90 transition-opacity"
                            disabled={loading}
                          >
                            <Sparkles className="w-3 h-3" /> {t('transcriptions.analyze')}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDelete(transcription.recordingId, e)}
                            className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-lg transition-colors ${
                              deleting === transcription.recordingId 
                                ? 'bg-red-500/50 text-white cursor-not-allowed' 
                                : isDark 
                                  ? 'bg-slate-700 text-red-400 hover:bg-red-500 hover:text-white' 
                                  : 'bg-gray-100 text-red-500 hover:bg-red-500 hover:text-white'
                            }`}
                            disabled={deleting === transcription.recordingId}
                            title={t('transcriptions.deleteTranscription')}
                          >
                            <Trash2 className={`w-3 h-3 ${deleting === transcription.recordingId ? 'animate-spin' : ''}`} />
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
