import { useEffect } from 'react';
import { Filter, X, Search } from 'lucide-react';
import useStore from '../store/useStore';

export default function Filters({ onApply }) {
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Filter className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1a1a2e]">Filtros</h3>
            <p className="text-xs text-gray-400">Refina tu búsqueda</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-1 transition-colors"
        >
          <X className="w-4 h-4" />
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Vendedor */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Vendedor</label>
          <select
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            className="input-field"
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
          <label className="block text-sm font-medium text-gray-600 mb-2">Sucursal</label>
          <select
            value={filters.branchId || ''}
            onChange={(e) => handleFilterChange('branchId', e.target.value)}
            className="input-field"
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
          <label className="block text-sm font-medium text-gray-600 mb-2">Resultado</label>
          <select
            value={filters.saleCompleted === null ? '' : filters.saleCompleted}
            onChange={(e) => handleFilterChange('saleCompleted', e.target.value === '' ? null : e.target.value === 'true')}
            className="input-field"
          >
            <option value="">Todos los resultados</option>
            <option value="true">✓ Venta realizada</option>
            <option value="false">✗ Sin venta</option>
          </select>
        </div>

        {/* Fecha desde */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Desde</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Hasta</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Puntuación mínima */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Puntuación mín.</label>
          <select
            value={filters.minScore || ''}
            onChange={(e) => handleFilterChange('minScore', e.target.value)}
            className="input-field"
          >
            <option value="">Sin mínimo</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>≥ {n} puntos</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button onClick={handleClear} className="btn-secondary">
          Limpiar
        </button>
        <button onClick={handleApply} className="btn-primary flex items-center gap-2">
          <Search className="w-4 h-4" />
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
