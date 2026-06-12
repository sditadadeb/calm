import { useEffect } from 'react';
import { Filter, X, Search } from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import SearchableSelect from './SearchableSelect';

export default function Filters({ onApply }) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { 
    filters, 
    setFilters, 
    clearFilters, 
    sellers, 
    branches, 
    fetchSellers, 
    fetchBranches 
  } = useStore();

  useEffect(() => {
    fetchSellers();
    fetchBranches();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value || null });
  };

  const handleApply = () => {
    if (onApply) onApply();
  };

  const handleClear = () => {
    clearFilters();
    if (onApply) onApply();
  };

  const inputClasses = `w-full px-3 py-1.5 text-sm rounded-md focus:outline-none focus:border-[#F5A623]/60 focus:ring-1 focus:ring-[#F5A623]/30 transition-colors ${
    isDark 
      ? 'bg-ink-overlay border border-line-strong text-white placeholder:text-slate-500' 
      : 'bg-white border border-gray-300 text-gray-800'
  }`;

  return (
    <div className={`rounded-lg border p-4 mb-6 ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#F5A623]" strokeWidth={1.8} />
          <h3 className={`font-display font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('filters.title')}</h3>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>· {t('filters.refineSearch')}</span>
        </div>
        <button
          onClick={handleClear}
          className={`text-xs flex items-center gap-1 transition-colors ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
        >
          <X className="w-3.5 h-3.5" />
          {t('filters.clearFilters')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Vendedor */}
        <div>
          <label className={`block text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('filters.seller')}</label>
          <SearchableSelect
            options={sellers}
            value={filters.userId || ''}
            onChange={(id) => handleFilterChange('userId', id)}
            allLabel={t('filters.allSellers')}
            isDark={isDark}
            inputClassName={inputClasses}
          />
        </div>

        {/* Sucursal */}
        <div>
          <label className={`block text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('filters.branch')}</label>
          <SearchableSelect
            options={branches}
            value={filters.branchId || ''}
            onChange={(id) => handleFilterChange('branchId', id)}
            allLabel={t('filters.allBranches')}
            isDark={isDark}
            inputClassName={inputClasses}
          />
        </div>

        {/* Resultado */}
        <div>
          <label className={`block text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('filters.result')}</label>
          <select
            value={filters.saleStatus || ''}
            onChange={(e) => handleFilterChange('saleStatus', e.target.value || null)}
            className={inputClasses}
          >
            <option value="">{t('filters.allResults')}</option>
            <option value="SALE_CONFIRMED">{t('filters.saleConfirmed')}</option>
            <option value="SALE_LIKELY">{t('filters.saleLikely')}</option>
            <option value="ADVANCE_NO_CLOSE">{t('filters.advanceNoClose')}</option>
            <option value="NO_SALE">{t('filters.noSale')}</option>
            <option value="UNINTERPRETABLE">{t('filters.uninterpretable')}</option>
          </select>
        </div>

        {/* Fecha desde */}
        <div>
          <label className={`block text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('filters.from')}</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className={`block text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('filters.to')}</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* Puntuación mínima */}
        <div>
          <label className={`block text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('filters.minScore')}</label>
          <select
            value={filters.minScore || ''}
            onChange={(e) => handleFilterChange('minScore', e.target.value)}
            className={inputClasses}
          >
            <option value="">{t('filters.noMinimum')}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>≥ {n} {t('filters.points')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button 
          onClick={handleClear} 
          className={`px-3 py-1.5 text-[13px] font-medium rounded-md border transition-colors ${isDark ? 'border-line-strong text-slate-300 hover:text-white hover:border-white/25' : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'}`}
        >
          {t('filters.clear')}
        </button>
        <button 
          onClick={handleApply} 
          className="px-3 py-1.5 text-[13px] font-semibold bg-[#F5A623] text-[#16120A] rounded-md hover:bg-[#FFBB54] transition-colors flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          {t('filters.applyFilters')}
        </button>
      </div>
    </div>
  );
}
