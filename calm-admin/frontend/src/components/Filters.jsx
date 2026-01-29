import { useEffect } from 'react';
import { Filter, X, Search } from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';

export default function Filters({ onApply }) {
  const { isDark } = useTheme();
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

  const inputClasses = `w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#F5A623] focus:border-transparent ${
    isDark 
      ? 'bg-slate-700 border border-slate-600 text-white' 
      : 'bg-white border border-gray-300 text-gray-800'
  }`;

  return (
    <div className={`rounded-2xl border p-6 mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <Filter className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Filtros</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Refina tu búsqueda</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className={`text-sm flex items-center gap-1 transition-colors ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
        >
          <X className="w-4 h-4" />
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Vendedor */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Vendedor</label>
          <select
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            className={inputClasses}
          >
            <option value="">Todos los vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sucursal */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Sucursal</label>
          <select
            value={filters.branchId || ''}
            onChange={(e) => handleFilterChange('branchId', e.target.value)}
            className={inputClasses}
          >
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Resultado */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Resultado</label>
          <select
            value={filters.saleCompleted === null ? '' : filters.saleCompleted}
            onChange={(e) => handleFilterChange('saleCompleted', e.target.value === '' ? null : e.target.value === 'true')}
            className={inputClasses}
          >
            <option value="">Todos los resultados</option>
            <option value="true">✓ Venta realizada</option>
            <option value="false">✗ Sin venta</option>
          </select>
        </div>

        {/* Fecha desde */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Desde</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Hasta</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* Puntuación mínima */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Puntuación mín.</label>
          <select
            value={filters.minScore || ''}
            onChange={(e) => handleFilterChange('minScore', e.target.value)}
            className={inputClasses}
          >
            <option value="">Sin mínimo</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>≥ {n} puntos</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button 
          onClick={handleClear} 
          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Limpiar
        </button>
        <button 
          onClick={handleApply} 
          className="px-4 py-2 bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
