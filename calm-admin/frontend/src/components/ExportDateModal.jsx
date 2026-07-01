import { useMemo, useState } from 'react';
import { X, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function addMonthsIso(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + months);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function isExportRangeValid(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return false;
  if (dateTo < dateFrom) return false;
  return dateTo <= addMonthsIso(dateFrom, 1);
}

export default function ExportDateModal({ formatLabel, onClose, onConfirm, exporting, branchFilterActive }) {
  const { isDark } = useTheme();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [splitByBranch, setSplitByBranch] = useState(false);
  const [error, setError] = useState(null);

  const maxDateTo = useMemo(() => (dateFrom ? addMonthsIso(dateFrom, 1) : ''), [dateFrom]);
  const minDateFrom = useMemo(() => (dateTo ? addMonthsIso(dateTo, -1) : ''), [dateTo]);

  const inputClass = `w-full px-3 py-2 rounded-md border text-sm ${
    isDark ? 'bg-ink-overlay border-line-strong text-white' : 'bg-white border-gray-300 text-gray-800'
  } focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent`;

  const handleFromChange = (value) => {
    setDateFrom(value);
    if (value && dateTo) {
      if (dateTo < value) setDateTo(value);
      else if (dateTo > addMonthsIso(value, 1)) setDateTo(addMonthsIso(value, 1));
    }
    setError(null);
  };

  const handleToChange = (value) => {
    setDateTo(value);
    if (value && dateFrom && value < dateFrom) {
      setDateFrom(value);
    }
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isExportRangeValid(dateFrom, dateTo)) {
      setError('El período no puede superar un mes. Ajustá las fechas e intentá de nuevo.');
      return;
    }
    onConfirm({ dateFrom, dateTo, splitByBranch: branchFilterActive ? false : splitByBranch });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`w-full max-w-md rounded-lg shadow-xl border ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-line' : 'border-gray-200'}`}>
          <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Exportar {formatLabel}</h2>
          <button type="button" onClick={onClose} className={isDark ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-gray-800'}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Seleccioná el período a exportar (máximo 1 mes).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Desde</label>
              <input
                type="date"
                required
                className={inputClass}
                value={dateFrom}
                max={dateTo || undefined}
                min={minDateFrom || undefined}
                onChange={(e) => handleFromChange(e.target.value)}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Hasta</label>
              <input
                type="date"
                required
                className={inputClass}
                value={dateTo}
                min={dateFrom || undefined}
                max={maxDateTo || undefined}
                onChange={(e) => handleToChange(e.target.value)}
              />
            </div>
          </div>

          {dateFrom && maxDateTo && (
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Fecha tope: {maxDateTo}
            </p>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <label className={`flex items-start gap-2.5 cursor-pointer ${branchFilterActive ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={splitByBranch}
              disabled={branchFilterActive || exporting}
              onChange={(e) => setSplitByBranch(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[#F5A623]"
            />
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Dividir por sucursal
              <span className={`block text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {formatLabel === 'XLSX'
                  ? 'Una hoja por sucursal en el mismo archivo Excel.'
                  : 'Un archivo CSV por sucursal dentro de un ZIP.'}
                {branchFilterActive && ' (Ya hay una sucursal filtrada.)'}
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`text-sm px-4 py-2 rounded-md transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={exporting}
              className="text-sm px-4 py-2 rounded-md bg-[#F5A623] text-[#16120A] font-semibold hover:bg-[#FFBB54] transition-colors inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exportando...' : 'Exportar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
