import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, Sparkles, Clock, Trash2, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import Filters from '../components/Filters';
import ScoreBadge from '../components/ScoreBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Transcriptions() {
  const { transcriptions, loading, recalculating, fetchTranscriptions, analyzeTranscription, deleteTranscription, setFilters } = useStore();
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const [deleting, setDeleting] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'recordingDate', direction: 'desc' });
  
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
  }, [transcriptions, sortConfig]);

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
              <ChevronUp className="w-4 h-4 text-[#F5A623]" /> : 
              <ChevronDown className="w-4 h-4 text-[#F5A623]" />
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
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');

    if (userId) urlFilters.userId = userId;
    if (branchId) urlFilters.branchId = branchId;
    if (saleCompleted !== null && saleCompleted !== '') {
      urlFilters.saleCompleted = saleCompleted === 'true';
    }
    if (dateFrom) urlFilters.dateFrom = dateFrom;
    if (dateTo) urlFilters.dateTo = dateTo;
    if (minScore) urlFilters.minScore = parseInt(minScore);
    if (maxScore) urlFilters.maxScore = parseInt(maxScore);

    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
    
    fetchTranscriptions();
  }, [searchParams]);

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
            <RefreshCw className="w-5 h-5 text-[#F5A623] animate-spin" />
            <div className="flex-1">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Recalculando métricas...
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Actualizando dashboard, vendedores y sucursales
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#F5A623] to-[#FFBB54] rounded-full animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        <FileText className="w-4 h-4" />
        <span>{transcriptions.length} registros</span>
      </div>

      {/* Filters */}
      <Filters onApply={fetchTranscriptions} />

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando transcripciones...</p>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <FileText className={`w-8 h-8 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No se encontraron transcripciones</h3>
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Intenta ajustar los filtros o sincronizar desde S3</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  <SortableHeader label="ID" sortKey="recordingId" />
                  <SortableHeader label="Vendedor" sortKey="userName" />
                  <SortableHeader label="Sucursal" sortKey="branchName" />
                  <SortableHeader label="Fecha" sortKey="recordingDate" />
                  <SortableHeader label="Resultado" sortKey="saleCompleted" />
                  <SortableHeader label="Puntuación" sortKey="sellerScore" />
                  <SortableHeader label="Estado" sortKey="analyzed" />
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {sortedTranscriptions.map((t, index) => (
                  <tr 
                    key={t.recordingId}
                    className={`animate-fade-in transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-[#F5A623]">#{t.recordingId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.userName || 'Desconocido'}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>ID: {t.userId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`capitalize ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.branchName || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDate(t.recordingDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {/* Sale Status Badge */}
                        {t.saleStatus === 'SALE_CONFIRMED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400" title="Venta confirmada con evidencia">
                            <CheckCircle className="w-3 h-3" /> Venta
                          </span>
                        )}
                        {t.saleStatus === 'SALE_LIKELY' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400" title="Alta probabilidad de venta">
                            <TrendingUp className="w-3 h-3" /> Probable
                          </span>
                        )}
                        {t.saleStatus === 'ADVANCE_NO_CLOSE' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400" title="Avance comercial sin cierre">
                            <AlertTriangle className="w-3 h-3" /> Avance
                          </span>
                        )}
                        {t.saleStatus === 'NO_SALE' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400" title="No hubo venta">
                            <XCircle className="w-3 h-3" /> Sin venta
                          </span>
                        )}
                        {t.saleStatus === 'UNINTERPRETABLE' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400" title="Transcripción no interpretable">
                            <HelpCircle className="w-3 h-3" /> No interp.
                          </span>
                        )}
                        {/* Fallback para transcripciones sin saleStatus */}
                        {!t.saleStatus && t.saleCompleted === true && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                            <CheckCircle className="w-3 h-3" /> Venta
                          </span>
                        )}
                        {!t.saleStatus && t.saleCompleted === false && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
                            <XCircle className="w-3 h-3" /> Sin venta
                          </span>
                        )}
                        {!t.saleStatus && t.saleCompleted === null && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-500'}`}>
                            Pendiente
                          </span>
                        )}
                        {/* Confidence indicator */}
                        {t.analysisConfidence !== null && t.analysisConfidence !== undefined && (
                          <div className="flex items-center gap-1" title={`Confianza: ${t.analysisConfidence}%`}>
                            <div className={`h-1 w-12 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-full rounded-full ${
                                  t.analysisConfidence >= 70 ? 'bg-green-500' : 
                                  t.analysisConfidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${t.analysisConfidence}%` }}
                              />
                            </div>
                            <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {t.analysisConfidence}%
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={t.sellerScore} size="small" />
                    </td>
                    <td className="px-6 py-4">
                      {t.analyzed ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Analizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-400 text-xs font-medium">
                          <Sparkles className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/transcriptions/${t.recordingId}`}
                          className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-[#F5A623] hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#F5A623] hover:text-white'}`}
                        >
                          <Eye className="w-3 h-3" /> Ver
                        </Link>
                        {!t.analyzed && (
                          <button
                            onClick={(e) => handleAnalyze(t.recordingId, e)}
                            className="text-xs py-2 px-3 inline-flex items-center gap-1 bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white rounded-lg hover:opacity-90 transition-opacity"
                            disabled={loading}
                          >
                            <Sparkles className="w-3 h-3" /> Analizar
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDelete(t.recordingId, e)}
                            className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-lg transition-colors ${
                              deleting === t.recordingId 
                                ? 'bg-red-500/50 text-white cursor-not-allowed' 
                                : isDark 
                                  ? 'bg-slate-700 text-red-400 hover:bg-red-500 hover:text-white' 
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
