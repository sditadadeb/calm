import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, Sparkles, Clock } from 'lucide-react';
import useStore from '../store/useStore';
import Filters from '../components/Filters';
import ScoreBadge from '../components/ScoreBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Transcriptions() {
  const { transcriptions, loading, fetchTranscriptions, analyzeTranscription } = useStore();

  useEffect(() => {
    fetchTranscriptions();
  }, []);

  const handleAnalyze = async (recordingId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await analyzeTranscription(recordingId);
    } catch (error) {
      alert('Error al analizar: ' + error.message);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Transcripciones</h1>
          <p className="text-gray-500 mt-1">Listado completo de atenciones</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="w-4 h-4" />
          <span>{transcriptions.length} registros</span>
        </div>
      </div>

      {/* Filters */}
      <Filters onApply={fetchTranscriptions} />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-[#1a1a2e] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Cargando transcripciones...</p>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron transcripciones</h3>
            <p className="text-gray-400">Intenta ajustar los filtros o sincronizar desde S3</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vendedor</th>
                  <th>Sucursal</th>
                  <th>Fecha</th>
                  <th>Resultado</th>
                  <th>Puntuación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transcriptions.map((t, index) => (
                  <tr 
                    key={t.recordingId}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td>
                      <span className="font-mono text-sm font-medium text-[#1a1a2e]">#{t.recordingId}</span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-[#1a1a2e]">{t.userName || 'Desconocido'}</p>
                        <p className="text-xs text-gray-400">ID: {t.userId}</p>
                      </div>
                    </td>
                    <td>
                      <span className="capitalize text-gray-600">{t.branchName || '-'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDate(t.recordingDate)}</span>
                      </div>
                    </td>
                    <td>
                      {t.saleCompleted === true && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" /> Venta
                        </span>
                      )}
                      {t.saleCompleted === false && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" /> Sin venta
                        </span>
                      )}
                      {t.saleCompleted === null && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td>
                      <ScoreBadge score={t.sellerScore} size="small" />
                    </td>
                    <td>
                      {t.analyzed ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Analizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium">
                          <Sparkles className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/transcriptions/${t.recordingId}`}
                          className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Ver
                        </Link>
                        {!t.analyzed && (
                          <button
                            onClick={(e) => handleAnalyze(t.recordingId, e)}
                            className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1"
                            disabled={loading}
                          >
                            <Sparkles className="w-3 h-3" /> Analizar
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
