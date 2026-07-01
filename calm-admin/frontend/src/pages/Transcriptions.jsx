import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Eye, EyeOff, Edit, Sparkles, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import useStore from '../store/useStore';
import { analyzeTranscription as apiAnalyzeTranscription, reimportAndAnalyzeTranscription as apiReimportAnalyze, exportTranscriptions } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Filters from '../components/Filters';
import ScoreBadge from '../components/ScoreBadge';
import ExtraDataModal from '../components/ExtraDataModal';
import ExportDateModal from '../components/ExportDateModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Transcriptions() {
  const { transcriptions, loading, recalculating, fetchTranscriptions, analyzeTranscription, excludeTranscription, setFilters, filters } = useStore();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'recordingDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [editingExtraData, setEditingExtraData] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);
  const [exporting, setExporting] = useState(false);
  const pageSize = 25;
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

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
      // Filtro por estado de análisis
      if (filters.analyzed === true || filters.analyzed === 'true') {
        if (!t.analyzed) return false;
      }
      if (filters.analyzed === false || filters.analyzed === 'false') {
        if (t.analyzed) return false;
      }
      // Filtro por resultado binario venta/no venta
      if (filters.saleCompleted === 'true' && t.saleCompleted !== true) return false;
      if (filters.saleCompleted === 'false' && t.saleCompleted !== false) return false;
      // Filtro por razón de no venta
      if (filters.noSaleReason && t.noSaleReason !== filters.noSaleReason) return false;
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

  const totalPages = Math.ceil(sortedTranscriptions.length / pageSize);
  const paginatedTranscriptions = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedTranscriptions.slice(start, start + pageSize);
  }, [sortedTranscriptions, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters, sortConfig]);

  // Componente para header ordenable
  const SortableHeader = ({ label, sortKey, className = '' }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th 
        className={`px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] cursor-pointer select-none transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'} ${className}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive ? (
            sortConfig.direction === 'asc' ? 
              <ChevronUp className="w-3.5 h-3.5 text-[#F5A623]" /> : 
              <ChevronDown className="w-3.5 h-3.5 text-[#F5A623]" />
          ) : (
            <ChevronsUpDown className="w-3 h-3 opacity-40" />
          )}
        </div>
      </th>
    );
  };

  // Estado con punto de color (rediseño): reemplaza las pills rellenas
  const StatusDot = ({ dotClass, textClass, icon: StatusIcon, title, children, pulse = false }) => (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${textClass}`} title={title}>
      <span className={`status-dot ${dotClass} ${pulse ? 'pulse' : ''}`} />
      {StatusIcon && <StatusIcon className="w-3 h-3 opacity-70" />}
      {children}
    </span>
  );

  useEffect(() => {
    const urlFilters = {};
    
    const userId = searchParams.get('userId');
    const branchId = searchParams.get('branchId');
    const saleStatus = searchParams.get('saleStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    const analyzed = searchParams.get('analyzed');
    const saleCompleted = searchParams.get('saleCompleted');
    const noSaleReason = searchParams.get('noSaleReason');

    if (userId) urlFilters.userId = userId;
    if (branchId) urlFilters.branchId = branchId;
    if (saleStatus) urlFilters.saleStatus = saleStatus;
    if (dateFrom) urlFilters.dateFrom = dateFrom;
    if (dateTo) urlFilters.dateTo = dateTo;
    if (minScore) urlFilters.minScore = parseInt(minScore);
    if (maxScore) urlFilters.maxScore = parseInt(maxScore);
    if (analyzed) urlFilters.analyzed = analyzed;
    if (saleCompleted) urlFilters.saleCompleted = saleCompleted;
    if (noSaleReason) urlFilters.noSaleReason = noSaleReason;

    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
    
    fetchTranscriptions();
  }, [searchParams]);

  const handleRowClick = (recordingId) => {
    navigate(`/transcriptions/${recordingId}`);
  };

  const handleAnalyze = async (recordingId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAnalyzing(recordingId);
      await analyzeTranscription(recordingId);
    } catch (error) {
      alert('Error al analizar: ' + (error.response?.data?.message || error.message));
    } finally {
      setAnalyzing(null);
    }
  };

  const isPendingTranscription = (transcription) =>
    transcription.transcriptionText?.startsWith('[Audio disponible');

  const handleReanalyze = async (recordingId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t('transcriptions.reimportReanalyzeConfirm'))) return;
    try {
      setAnalyzing(recordingId);
      await apiReimportAnalyze(recordingId);
    } catch (error) {
      alert('Error al re-analizar: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
    } finally {
      setAnalyzing(null);
    }
  };

  const selectablePageIds = useMemo(
    () => paginatedTranscriptions.filter(tr => !isPendingTranscription(tr)).map(tr => tr.recordingId),
    [paginatedTranscriptions]
  );
  const allPageSelected = selectablePageIds.length > 0 && selectablePageIds.every(id => selected.has(id));

  const toggleSelect = (recordingId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(recordingId)) next.delete(recordingId);
      else next.add(recordingId);
      return next;
    });
  };

  const toggleSelectPage = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        selectablePageIds.forEach(id => next.delete(id));
      } else {
        selectablePageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleBulkReanalyze = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(t('transcriptions.bulkReimportConfirm', { count: ids.length }))) return;

    setBulkAnalyzing(true);
    setBulkProgress({ current: 0, total: ids.length });
    let errors = 0;

    for (let i = 0; i < ids.length; i++) {
      try {
        setAnalyzing(ids[i]);
        await apiReimportAnalyze(ids[i]);
      } catch {
        errors++;
      } finally {
        setBulkProgress({ current: i + 1, total: ids.length });
      }
    }

    setAnalyzing(null);
    setBulkAnalyzing(false);
    setSelected(new Set());
    await fetchTranscriptions();
    useStore.getState().fetchDashboardMetrics();

    if (errors > 0) {
      alert(`${t('transcriptions.bulkDone')}: ${ids.length - errors} OK, ${errors} ${t('transcriptions.bulkErrors')}`);
    }
  };

  const handleExclude = async (recordingId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmed = window.confirm(t('transcriptions.excludeConfirm'));
    
    if (!confirmed) return;
    
    try {
      setDeleting(recordingId);
      await excludeTranscription(recordingId);
    } catch (error) {
      alert(t('transcriptions.excludeError') + ': ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(null);
    }
  };

  const handleExportConfirm = async ({ dateFrom, dateTo, splitByBranch }) => {
    try {
      setExporting(true);
      const response = await exportTranscriptions(exportFormat, { ...filters, dateFrom, dateTo, splitByBranch });
      const contentType = response.headers['content-type'] || '';
      const ext = contentType.includes('zip') ? 'zip' : exportFormat;
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcripciones_${dateFrom}_${dateTo}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportFormat(null);
    } catch (error) {
      alert('Error al exportar: ' + (error.response?.data?.error || error.message));
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "d MMM · HH:mm", { locale: es });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de recalculando métricas */}
      {recalculating && (
        <div className={`rounded-lg p-4 border ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#F5A623] animate-spin" />
            <div className="flex-1">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {t('transcriptions.recalculating')}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('transcriptions.updatingDashboard')}
              </p>
            </div>
          </div>
          <div className={`mt-3 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
            <div 
              className="h-full bg-[#F5A623] rounded-full animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Info + export */}
      <div className="flex items-center justify-between gap-2">
        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <FileText className="w-4 h-4" />
          <span>{filteredTranscriptions.length} {t('common.of')} {transcriptions.length} {t('common.records')}</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen((v) => !v)}
            className={`text-sm px-3 py-2 rounded-md border inline-flex items-center gap-1.5 transition-colors ${isDark ? 'border-line-strong text-slate-300 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          {exportMenuOpen && (
            <div className={`absolute right-0 mt-1 w-32 rounded-md border shadow-lg z-20 ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
              {['csv', 'xlsx'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => { setExportFormat(fmt); setExportMenuOpen(false); }}
                  className={`w-full text-left text-sm px-3 py-2 transition-colors ${isDark ? 'text-slate-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters - client-side, no need to re-fetch */}
      <Filters />

      {/* Barra de acciones masivas */}
      {isAdmin && (selected.size > 0 || bulkAnalyzing) && (
        <div className={`rounded-lg px-5 py-3 border flex flex-wrap items-center gap-4 ${isDark ? 'bg-ink-raised border-[#F5A623]/40' : 'bg-amber-50 border-[#F5A623]/40'}`}>
          {bulkAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 text-[#F5A623] animate-spin" />
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {t('transcriptions.bulkAnalyzing')} {bulkProgress.current}/{bulkProgress.total}
              </span>
              <div className={`flex-1 min-w-[120px] h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-[#F5A623] to-[#FFBB54] transition-all duration-300"
                  style={{ width: bulkProgress.total > 0 ? `${(bulkProgress.current / bulkProgress.total) * 100}%` : '0%' }}
                />
              </div>
            </>
          ) : (
            <>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {selected.size} {t('transcriptions.selectedCount')}
              </span>
              <button
                onClick={handleBulkReanalyze}
                className="text-xs py-2 px-4 inline-flex items-center gap-1.5 bg-[#F5A623] text-[#16120A] rounded-md hover:bg-[#FFBB54] transition-colors font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" /> {t('transcriptions.reanalyzeSelected')}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-md transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
              >
                <X className="w-3.5 h-3.5" /> {t('transcriptions.clearSelection')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('transcriptions.loadingTranscriptions')}</p>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <FileText className={`w-8 h-8 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('transcriptions.noTranscriptions')}</h3>
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('transcriptions.adjustFilters')}</p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'border-line-strong' : 'border-gray-200 bg-gray-50'}`}>
                <tr>
                  {isAdmin && (
                    <th className="pl-5 pr-2 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectPage}
                        disabled={bulkAnalyzing || selectablePageIds.length === 0}
                        className="w-4 h-4 rounded accent-[#F5A623] cursor-pointer"
                        title={t('transcriptions.selectPage')}
                      />
                    </th>
                  )}
                  <SortableHeader label={t('transcriptions.id')} sortKey="recordingId" />
                  <SortableHeader label={t('transcriptions.seller')} sortKey="userName" />
                  <SortableHeader label={t('transcriptions.branch')} sortKey="branchName" />
                  <SortableHeader label={t('transcriptions.date')} sortKey="recordingDate" />
                  <SortableHeader label={t('transcriptions.result')} sortKey="saleCompleted" />
                  <SortableHeader label={t('transcriptions.score')} sortKey="sellerScore" />
                  <SortableHeader label={t('transcriptions.status')} sortKey="analyzed" />
                  <th className={`px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-line' : 'divide-gray-200'}`}>
                {paginatedTranscriptions.map((transcription, index) => (
                  <tr 
                    key={transcription.recordingId}
                    onClick={() => handleRowClick(transcription.recordingId)}
                    className={`row-cal animate-fade-in transition-colors cursor-pointer ${selected.has(transcription.recordingId) ? (isDark ? 'bg-[#F5A623]/10' : 'bg-amber-50/70') : ''} ${isPendingTranscription(transcription) ? (isDark ? 'opacity-70' : 'opacity-80') : ''} ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {isAdmin && (
                      <td className="pl-5 pr-2 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(transcription.recordingId)}
                          onChange={() => toggleSelect(transcription.recordingId)}
                          disabled={bulkAnalyzing || isPendingTranscription(transcription)}
                          className="w-4 h-4 rounded accent-[#F5A623] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          title={isPendingTranscription(transcription) ? t('transcriptions.reanalyzePending') : undefined}
                        />
                      </td>
                    )}
                    <td className="px-5 py-3 max-w-[120px]">
                      <span className="font-mono text-xs text-[#F5A623]/85 block truncate" title={transcription.recordingId}>
                        #…{transcription.recordingId.length > 12 ? transcription.recordingId.slice(-12) : transcription.recordingId}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className={`font-semibold text-[13.5px] ${isDark ? 'text-white' : 'text-gray-800'}`}>{transcription.userName || t('common.unknown')}</p>
                        <p className={`text-[11.5px] mt-px ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>ID {transcription.userId}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`capitalize text-[13.5px] ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{transcription.branchName || '-'}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`text-[13px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{formatDate(transcription.recordingDate)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        {isPendingTranscription(transcription) ? (
                          <StatusDot dotClass="bg-amber-400" textClass={isDark ? 'text-amber-400' : 'text-amber-600'} title={t('transcriptions.reanalyzePending')} pulse>
                            {t('transcriptions.transcriptionPending')}
                          </StatusDot>
                        ) : (
                        <>
                        {/* Sale Status */}
                        {transcription.saleStatus === 'SALE_CONFIRMED' && (
                          <StatusDot dotClass="bg-emerald-400" textClass={isDark ? 'text-emerald-300' : 'text-emerald-600'} title={t('transcriptions.saleConfirmed')}>
                            {t('transcriptions.sale')}
                          </StatusDot>
                        )}
                        {transcription.saleStatus === 'SALE_LIKELY' && (
                          <StatusDot dotClass="bg-teal-400" textClass={isDark ? 'text-teal-300' : 'text-teal-600'} title={t('transcriptions.saleProbable')}>
                            {t('transcriptions.probable')}
                          </StatusDot>
                        )}
                        {transcription.saleStatus === 'ADVANCE_NO_CLOSE' && (
                          <StatusDot dotClass="bg-yellow-400" textClass={isDark ? 'text-yellow-300' : 'text-yellow-600'} title={t('transcriptions.advanceNoClose')}>
                            {t('transcriptions.advance')}
                          </StatusDot>
                        )}
                        {transcription.saleStatus === 'NO_SALE' && (
                          <StatusDot dotClass="bg-red-400" textClass={isDark ? 'text-red-400' : 'text-red-500'} title={t('transcriptions.noSaleResult')}>
                            {t('transcriptions.noSale')}
                          </StatusDot>
                        )}
                        {transcription.saleStatus === 'UNINTERPRETABLE' && (
                          <StatusDot dotClass="bg-slate-500" textClass={isDark ? 'text-slate-400' : 'text-gray-400'} title={t('transcriptions.uninterpretable')}>
                            {t('transcriptions.notInterp')}
                          </StatusDot>
                        )}
                        {/* Fallback para transcripciones sin saleStatus */}
                        {!transcription.saleStatus && transcription.saleCompleted === true && (
                          <StatusDot dotClass="bg-emerald-400" textClass={isDark ? 'text-emerald-300' : 'text-emerald-600'}>
                            {t('transcriptions.sale')}
                          </StatusDot>
                        )}
                        {!transcription.saleStatus && transcription.saleCompleted === false && (
                          <StatusDot dotClass="bg-red-400" textClass={isDark ? 'text-red-400' : 'text-red-500'}>
                            {t('transcriptions.noSale')}
                          </StatusDot>
                        )}
                        {!transcription.saleStatus && transcription.saleCompleted === null && (
                          <StatusDot dotClass="bg-slate-500" textClass={isDark ? 'text-slate-400' : 'text-gray-400'}>
                            {t('transcriptions.pending')}
                          </StatusDot>
                        )}
                        </>
                        )}
                        {/* Confidence indicator */}
                        {!isPendingTranscription(transcription) && transcription.analysisConfidence !== null && transcription.analysisConfidence !== undefined && (
                          <div className="flex items-center gap-1" title={`Confianza: ${transcription.analysisConfidence}%`}>
                            <div className={`h-[3px] w-12 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
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
                    <td className="px-5 py-3">
                      <ScoreBadge score={transcription.sellerScore} size="small" />
                    </td>
                    <td className="px-5 py-3">
                      {isPendingTranscription(transcription) ? (
                        <StatusDot dotClass="bg-amber-400" textClass="text-amber-400" pulse>
                          {t('transcriptions.transcriptionPending')}
                        </StatusDot>
                      ) : transcription.analyzed ? (
                        <StatusDot dotClass="bg-emerald-400" textClass={isDark ? 'text-emerald-300' : 'text-emerald-600'}>
                          {t('transcriptions.analyzed')}
                        </StatusDot>
                      ) : (
                        <StatusDot dotClass="bg-yellow-400" textClass={isDark ? 'text-yellow-300' : 'text-yellow-600'} pulse>
                          {t('transcriptions.pending')}
                        </StatusDot>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/transcriptions/${transcription.recordingId}`}
                          className={`w-7 h-7 grid place-items-center rounded border border-transparent transition-all ${isDark ? 'text-slate-500 hover:text-[#F5A623] hover:border-line-strong hover:bg-ink-overlay' : 'text-gray-400 hover:text-[#F5A623] hover:border-gray-300 hover:bg-gray-50'}`}
                          title={t('common.view')}
                        >
                          <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingExtraData(transcription); }}
                          className={`w-7 h-7 grid place-items-center rounded border border-transparent transition-all ${isDark ? 'text-slate-500 hover:text-[#F5A623] hover:border-line-strong hover:bg-ink-overlay' : 'text-gray-400 hover:text-[#F5A623] hover:border-gray-300 hover:bg-gray-50'}`}
                          title="Editar datos extra"
                        >
                          <Edit className="w-3.5 h-3.5" strokeWidth={1.8} />
                        </button>
                        {!transcription.analyzed && !isAdmin && (
                          <button
                            onClick={(e) => handleAnalyze(transcription.recordingId, e)}
                            className={`w-7 h-7 grid place-items-center rounded border border-transparent transition-all disabled:opacity-40 ${isDark ? 'text-slate-500 hover:text-[#F5A623] hover:border-line-strong hover:bg-ink-overlay' : 'text-gray-400 hover:text-[#F5A623] hover:border-gray-300 hover:bg-gray-50'}`}
                            disabled={loading || analyzing === transcription.recordingId || isPendingTranscription(transcription)}
                            title={isPendingTranscription(transcription) ? t('transcriptions.reanalyzePending') : t('transcriptions.analyze')}
                          >
                            {analyzing === transcription.recordingId ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F5A623]" strokeWidth={1.8} />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} />
                            )}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={(e) => handleReanalyze(transcription.recordingId, e)}
                            className={`w-7 h-7 grid place-items-center rounded border border-transparent transition-all disabled:opacity-40 ${isDark ? 'text-slate-500 hover:text-[#F5A623] hover:border-line-strong hover:bg-ink-overlay' : 'text-gray-400 hover:text-[#F5A623] hover:border-gray-300 hover:bg-gray-50'}`}
                            disabled={bulkAnalyzing || analyzing === transcription.recordingId || isPendingTranscription(transcription)}
                            title={isPendingTranscription(transcription) ? t('transcriptions.reanalyzePending') : (transcription.analyzed ? t('transcriptions.reanalyze') : t('transcriptions.analyze'))}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${analyzing === transcription.recordingId ? 'animate-spin text-[#F5A623]' : ''}`} strokeWidth={1.8} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={(e) => handleExclude(transcription.recordingId, e)}
                            className={`w-7 h-7 grid place-items-center rounded border border-transparent transition-all disabled:opacity-40 ${isDark ? 'text-slate-500 hover:text-red-400 hover:border-line-strong hover:bg-ink-overlay' : 'text-gray-400 hover:text-red-500 hover:border-gray-300 hover:bg-gray-50'}`}
                            disabled={deleting === transcription.recordingId || bulkAnalyzing}
                            title={t('transcriptions.excludeTranscription')}
                          >
                            <EyeOff className={`w-3.5 h-3.5 ${deleting === transcription.recordingId ? 'animate-pulse text-red-400' : ''}`} strokeWidth={1.8} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-line' : 'border-gray-200'}`}>
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, sortedTranscriptions.length)} de {sortedTranscriptions.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className={`p-2 rounded-md transition-colors ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className={`p-2 rounded-md transition-colors ${currentPage >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {editingExtraData && (
        <ExtraDataModal
          transcription={editingExtraData}
          onSaved={() => fetchTranscriptions()}
          onClose={() => setEditingExtraData(null)}
        />
      )}

      {exportFormat && (
        <ExportDateModal
          formatLabel={exportFormat.toUpperCase()}
          exporting={exporting}
          branchFilterActive={!!filters.branchId}
          onClose={() => setExportFormat(null)}
          onConfirm={handleExportConfirm}
        />
      )}
    </div>
  );
}
