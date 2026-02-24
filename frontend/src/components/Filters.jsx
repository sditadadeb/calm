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

  const inputClasses = `w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#004F9F] focus:border-transparent ${
    isDark 
      ? 'bg-slate-700 border border-slate-600 text-white' 
      : 'bg-white border border-gray-300 text-gray-800'
  }`;

  return (
    <div className={`rounded-2xl border p-6 mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <Filter className="w-5 h-5 text-[#004F9F]" />
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
        {/* Agente */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Agente</label>
          <select
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            className={inputClasses}
          >
            <option value="">Todos los agentes</option>
            {sellers.map((seller, idx) => (
              <option key={`${seller.id ?? 'noid'}-${seller.name ?? 'noname'}-${idx}`} value={seller.id}>
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
            {branches.map((branch, idx) => (
              <option key={`${branch.id ?? 'noid'}-${branch.name ?? 'noname'}-${idx}`} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Resultado de llamada */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Resultado</label>
          <select
            value={filters.resultadoLlamada || ''}
            onChange={(e) => handleFilterChange('resultadoLlamada', e.target.value || null)}
            className={inputClasses}
          >
            <option value="">Todos</option>
            <option value="resuelto">✓ Resuelto</option>
            <option value="parcial">Parcial</option>
            <option value="no resuelto">No resuelto</option>
            <option value="derivado">Derivado</option>
            <option value="falta info">Falta info</option>
          </select>
        </div>

        {/* Motivo principal */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Motivo</label>
          <select
            value={filters.motivoPrincipal || ''}
            onChange={(e) => handleFilterChange('motivoPrincipal', e.target.value || null)}
            className={inputClasses}
          >
            <option value="">Todos</option>
            <option value="Licencias Médicas">Licencias Médicas</option>
            <option value="Pensiones">Pensiones</option>
            <option value="Cotizaciones">Cotizaciones</option>
            <option value="Certificados">Certificados</option>
            <option value="Información Seguro Ley N° 16.744">Información Seguro Ley N° 16.744</option>
            <option value="Prevención y/o prestaciones preventivas">Prevención y/o prestaciones preventivas</option>
            <option value="Prestaciones Médicas">Prestaciones Médicas</option>
            <option value="Denuncias de enfermedad y accidentes laborales">Denuncias de enfermedad y accidentes laborales</option>
            <option value="Registro trabajadores independientes voluntarios">Registro trabajadores independientes voluntarios</option>
            <option value="Operación Renta">Operación Renta</option>
            <option value="Otros">Otros</option>
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
          className="px-4 py-2 bg-gradient-to-r from-[#004F9F] to-[#003A79] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
