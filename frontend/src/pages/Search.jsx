import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, CheckCircle, XCircle, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { searchTranscriptions } from '../api';
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
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    saleCompleted: null
  });
  
  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!query || query.trim().length < 2) {
      return;
    }
    
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await searchTranscriptions(query.trim(), filters);
      setResults(response.data.results || []);
      setTotalResults(response.data.totalResults || 0);
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
            <mark key={i} className="bg-emerald-500/20 text-emerald-400 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };
  
  const hasActiveFilters = filters.saleCompleted !== null;
  
  return (
    <div className="space-y-6">
      {/* Search Box */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-gray-400'}`} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en conversaciones analizadas..."
                className={`w-full pl-12 pr-4 py-3 rounded-lg border text-lg ${
                  isDark 
                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 focus:border-emerald-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-emerald-500'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
              />
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                loading || query.trim().length < 2
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:opacity-90'
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
                  ? 'text-zinc-300 hover:bg-zinc-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              } ${hasActiveFilters ? 'text-emerald-500' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {[filters.saleCompleted !== null].filter(Boolean).length}
                </span>
              )}
            </button>
            
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-emerald-500 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className={`grid grid-cols-1 md:grid-cols-1 gap-4 p-4 rounded-lg ${isDark ? 'bg-zinc-800/60' : 'bg-gray-50'}`}>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
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
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="">Todos</option>
                  <option value="true">Resuelto</option>
                  <option value="false">No resuelto</option>
                </select>
              </div>
            </div>
          )}
        </form>
      </div>
      
      {/* Results Summary */}
      {searched && !loading && (
        <div className={`flex items-center gap-4 px-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
          <span className="font-medium">
            {totalResults === 0 ? (
              'No se encontraron resultados'
            ) : (
              <>
                <span className="text-emerald-500">{totalResults}</span> transcripción{totalResults !== 1 && 'es'} encontrada{totalResults !== 1 && 's'}
              </>
            )}
          </span>
          {totalMatches > 0 && (
            <>
              <span>•</span>
              <span>
                <span className="text-emerald-500">{totalMatches}</span> coincidencia{totalMatches !== 1 && 's'} totales
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
                  ? 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/50' 
                  : 'bg-white border-gray-200 hover:border-emerald-500/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <FileText className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {result.recordingId}
                    </span>
                    <div className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {formatDate(result.recordingDate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Match count */}
                  <span className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'}`}>
                    {result.matchCount} coincidencia{result.matchCount !== 1 && 's'}
                  </span>
                  
                  {/* Sale status */}
                  {result.saleCompleted !== null && (
                    result.saleCompleted ? (
                      <span className="flex items-center gap-1 text-sm px-2 py-1 rounded bg-green-500/20 text-green-400">
                        <CheckCircle className="w-4 h-4" /> Resuelto
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm px-2 py-1 rounded bg-red-500/20 text-red-400">
                        <XCircle className="w-4 h-4" /> No resuelto
                      </span>
                    )
                  )}
                  
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
                </div>
              </div>
              
              {/* Metadata */}
              <div className={`flex items-center gap-4 mb-4 text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                {result.sellerScore && (
                  <span className="flex items-center gap-1">
                    Score calidad: {result.sellerScore}/10
                  </span>
                )}
              </div>
              
              {/* Snippets */}
              {result.snippets && result.snippets.length > 0 && (
                <div className="space-y-2">
                  {result.snippets.map((snippet, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-3 rounded-lg border-l-2 border-emerald-500 ${
                        isDark ? 'bg-zinc-800/60 text-zinc-300' : 'bg-gray-50 text-gray-600'
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
        <div className={`text-center py-16 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
          <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Buscar en transcripciones
          </h3>
          <p className="max-w-md mx-auto">
            Ingresá una palabra o frase para buscar en conversaciones analizadas.
            Por ejemplo: "precio", "descuento", "competencia", "financiación".
          </p>
        </div>
      )}
      
      {/* No Results */}
      {searched && !loading && results.length === 0 && (
        <div className={`text-center py-16 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
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
              className="mt-4 text-emerald-500 hover:underline"
            >
              Probar sin filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
