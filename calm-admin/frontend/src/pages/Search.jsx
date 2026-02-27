import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, Calendar, User, Building2, CheckCircle, XCircle, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { searchTranscriptions, getSellers, getBranches } from '../api';
import { useTheme } from '../context/ThemeContext';

export default function Search() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    userId: null,
    branchId: null,
    saleCompleted: null
  });
  
  useEffect(() => {
    fetchFiltersData();
  }, []);
  
  const fetchFiltersData = async () => {
    try {
      const [sellersRes, branchesRes] = await Promise.all([
        getSellers(),
        getBranches()
      ]);
      setSellers(sellersRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };
  
  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!query || query.trim().length < 2) {
      return;
    }
    
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await searchTranscriptions(query.trim(), filters);
      let searchResults = response.data.results || [];
      
      // Filter by logged-in user's sellerId
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.sellerId) {
        searchResults = searchResults.filter(r => String(r.userId) === String(currentUser.sellerId));
      }
      
      setResults(searchResults);
      setTotalResults(searchResults.length);
      setTotalMatches(response.data.totalMatches || 0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
      setTotalMatches(0);
    } finally {
      setLoading(false);
    }
  };
  
  const clearFilters = () => {
    setFilters({
      userId: null,
      branchId: null,
      saleCompleted: null
    });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Renderiza el snippet con la palabra resaltada
  const renderSnippet = (snippet) => {
    // El snippet viene con **palabra** para marcar coincidencias
    const parts = snippet.split(/\*\*(.*?)\*\*/g);
    
    return (
      <span>
        {parts.map((part, i) => 
          i % 2 === 1 ? (
            <mark key={i} className="bg-[#F5A623]/30 text-[#F5A623] font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };
  
  const hasActiveFilters = filters.userId || filters.branchId || filters.saleCompleted !== null;
  
  return (
    <div className="space-y-6">
      {/* Search Box */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en todas las transcripciones..."
                className={`w-full pl-12 pr-4 py-3 rounded-lg border text-lg ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-[#F5A623]' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#F5A623]'
                } focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 transition-all`}
              />
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                loading || query.trim().length < 2
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white hover:opacity-90'
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
              Buscar
            </button>
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isDark 
                  ? 'text-slate-300 hover:bg-slate-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              } ${hasActiveFilters ? 'text-[#F5A623]' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="bg-[#F5A623] text-white text-xs px-1.5 py-0.5 rounded-full">
                  {[filters.userId, filters.branchId, filters.saleCompleted !== null].filter(Boolean).length}
                </span>
              )}
            </button>
            
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-[#F5A623] hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              {/* Vendedor */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <User className="w-4 h-4 inline mr-1" />
                  Vendedor
                </label>
                <select
                  value={filters.userId || ''}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value || null })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="">Todos</option>
                  {sellers.map((s) => (
                    <option key={s.id || s.userId} value={s.id || s.userId}>
                      {s.name || s.userName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sucursal */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Sucursal
                </label>
                <select
                  value={filters.branchId || ''}
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value || null })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="">Todas</option>
                  {branches.map((b) => (
                    <option key={b.id || b.branchId} value={b.id || b.branchId}>
                      {b.name || b.branchName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Resultado */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Resultado
                </label>
                <select
                  value={filters.saleCompleted === null ? '' : filters.saleCompleted.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    saleCompleted: e.target.value === '' ? null : e.target.value === 'true' 
                  })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="">Todos</option>
                  <option value="true">Con venta</option>
                  <option value="false">Sin venta</option>
                </select>
              </div>
            </div>
          )}
        </form>
      </div>
      
      {/* Results Summary */}
      {searched && !loading && (
        <div className={`flex items-center gap-4 px-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <span className="font-medium">
            {totalResults === 0 ? (
              'No se encontraron resultados'
            ) : (
              <>
                <span className="text-[#F5A623]">{totalResults}</span> transcripción{totalResults !== 1 && 'es'} encontrada{totalResults !== 1 && 's'}
              </>
            )}
          </span>
          {totalMatches > 0 && (
            <>
              <span>•</span>
              <span>
                <span className="text-[#F5A623]">{totalMatches}</span> coincidencia{totalMatches !== 1 && 's'} totales
              </span>
            </>
          )}
        </div>
      )}
      
      {/* Results List */}
      {searched && !loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.recordingId}
              onClick={() => navigate(`/transcriptions/${result.recordingId}`)}
              className={`rounded-xl border p-5 cursor-pointer transition-all hover:shadow-lg ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 hover:border-[#F5A623]/50' 
                  : 'bg-white border-gray-200 hover:border-[#F5A623]/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#F5A623]/20">
                    <FileText className="w-5 h-5 text-[#F5A623]" />
                  </div>
                  <div>
                    <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {result.recordingId}
                    </span>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {formatDate(result.recordingDate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Match count */}
                  <span className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                    {result.matchCount} coincidencia{result.matchCount !== 1 && 's'}
                  </span>
                  
                  {/* Sale status */}
                  {result.saleCompleted !== null && (
                    result.saleCompleted ? (
                      <span className="flex items-center gap-1 text-sm px-2 py-1 rounded bg-green-500/20 text-green-400">
                        <CheckCircle className="w-4 h-4" /> Venta
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm px-2 py-1 rounded bg-red-500/20 text-red-400">
                        <XCircle className="w-4 h-4" /> Sin venta
                      </span>
                    )
                  )}
                  
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                </div>
              </div>
              
              {/* Metadata */}
              <div className={`flex items-center gap-4 mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {result.userName || 'Sin asignar'}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {result.branchName || 'Sin sucursal'}
                </span>
                {result.sellerScore && (
                  <span className="flex items-center gap-1">
                    ⭐ {result.sellerScore}/10
                  </span>
                )}
              </div>
              
              {/* Snippets */}
              {result.snippets && result.snippets.length > 0 && (
                <div className="space-y-2">
                  {result.snippets.map((snippet, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-3 rounded-lg border-l-2 border-[#F5A623] ${
                        isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {renderSnippet(snippet)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!searched && (
        <div className={`text-center py-16 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Buscar en transcripciones
          </h3>
          <p className="max-w-md mx-auto">
            Ingresá una palabra o frase para buscar en todas las conversaciones.
            Por ejemplo: "precio", "descuento", "competencia", "financiación".
          </p>
        </div>
      )}
      
      {/* No Results */}
      {searched && !loading && results.length === 0 && (
        <div className={`text-center py-16 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <XCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Sin resultados
          </h3>
          <p>
            No se encontraron transcripciones que contengan "{query}".
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[#F5A623] hover:underline"
            >
              Probar sin filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
