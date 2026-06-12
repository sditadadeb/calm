import { useEffect, useState } from 'react';
import { EyeOff, RotateCcw, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import useStore from '../store/useStore';
import { getExcludedTranscriptions } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Excluded() {
  const { restoreTranscription, recalculating } = useStore();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [error, setError] = useState(null);

  const fetchExcluded = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getExcludedTranscriptions();
      setItems(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExcluded();
  }, []);

  const handleRestore = async (recordingId) => {
    const confirmed = window.confirm(t('excluded.restoreConfirm'));
    if (!confirmed) return;

    try {
      setRestoring(recordingId);
      await restoreTranscription(recordingId);
      setItems((prev) => prev.filter((i) => i.recordingId !== recordingId));
    } catch (err) {
      alert(t('excluded.restoreError') + ': ' + (err.response?.data?.message || err.message));
    } finally {
      setRestoring(null);
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

  const thClass = `px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`;
  const tdClass = `px-6 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`;

  return (
    <div className="space-y-6">
      {recalculating && (
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#F5A623] animate-spin" />
            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('excluded.recalculating')}
            </span>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className={`rounded-xl p-4 border flex items-start gap-3 ${isDark ? 'bg-ink-raised border-line' : 'bg-amber-50 border-amber-200'}`}>
        <EyeOff className="w-5 h-5 text-[#F5A623] mt-0.5 shrink-0" />
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {t('excluded.infoTitle')}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {t('excluded.infoText')}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-[#F5A623] animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <EyeOff className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {t('excluded.empty')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-slate-900/50' : 'bg-gray-50'}>
                <tr>
                  <th className={thClass}>ID</th>
                  <th className={thClass}>{t('excluded.seller')}</th>
                  <th className={thClass}>{t('excluded.branch')}</th>
                  <th className={thClass}>{t('excluded.date')}</th>
                  <th className={thClass}>{t('excluded.status')}</th>
                  <th className={`${thClass} text-right`}>{t('excluded.actions')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-line' : 'divide-gray-100'}`}>
                {items.map((item) => (
                  <tr key={item.recordingId} className={isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}>
                    <td className={`${tdClass} font-mono text-xs`}>{item.recordingId}</td>
                    <td className={tdClass}>{item.userName || '-'}</td>
                    <td className={tdClass}>{item.branchName || '-'}</td>
                    <td className={tdClass}>{formatDate(item.recordingDate)}</td>
                    <td className={tdClass}>
                      {item.analyzed ? (
                        item.saleCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle className="w-3 h-3" /> {t('excluded.sale')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <XCircle className="w-3 h-3" /> {t('excluded.noSale')}
                          </span>
                        )
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3" /> {t('excluded.notAnalyzed')}
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <button
                        onClick={() => handleRestore(item.recordingId)}
                        disabled={restoring === item.recordingId}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors ${
                          restoring === item.recordingId
                            ? 'bg-[#F5A623]/50 text-white cursor-not-allowed'
                            : 'bg-[#F5A623] text-white hover:bg-[#D4911F]'
                        }`}
                      >
                        {restoring === item.recordingId ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        {t('excluded.restore')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          {items.length} {t('excluded.total')}
        </p>
      )}
    </div>
  );
}
