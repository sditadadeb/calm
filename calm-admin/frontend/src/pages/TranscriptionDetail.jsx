import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Calendar,
  CheckCircle,
  XCircle,
  Sparkles,
  MessageSquare,
  Target,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  FileText
} from 'lucide-react';
import useStore from '../store/useStore';
import ScoreBadge from '../components/ScoreBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TranscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    selectedTranscription, 
    loading, 
    fetchTranscription, 
    analyzeTranscription,
    clearSelectedTranscription 
  } = useStore();

  useEffect(() => {
    fetchTranscription(id);
    return () => clearSelectedTranscription();
  }, [id]);

  const handleAnalyze = async () => {
    try {
      await analyzeTranscription(id);
    } catch (error) {
      alert('Error al analizar: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd 'de' MMMM yyyy, HH:mm", { locale: es });
    } catch {
      return '-';
    }
  };

  if (loading || !selectedTranscription) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a1a2e] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando transcripción...</p>
        </div>
      </div>
    );
  }

  const t = selectedTranscription;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Button */}
      <button
        onClick={() => navigate('/transcriptions')}
        className="flex items-center gap-2 text-gray-500 hover:text-[#1a1a2e] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al listado
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xl font-bold text-[#1a1a2e]">#{t.recordingId}</span>
              {t.saleCompleted === true && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  <CheckCircle className="w-4 h-4" /> Venta realizada
                </span>
              )}
              {t.saleCompleted === false && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                  <XCircle className="w-4 h-4" /> Sin venta
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-500">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{t.userName || 'Vendedor desconocido'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="capitalize">{t.branchName || 'Sucursal desconocida'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(t.recordingDate)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Puntuación</p>
              <ScoreBadge score={t.sellerScore} />
            </div>
            
            {!t.analyzed && (
              <button
                onClick={handleAnalyze}
                className="btn-primary flex items-center gap-2"
                disabled={loading}
              >
                <Sparkles className="w-5 h-5" />
                Analizar con IA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      {t.analyzed ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Executive Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#1a1a2e] rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-[#1a1a2e]">Resumen Ejecutivo</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">{t.executiveSummary || 'Sin resumen disponible'}</p>
          </div>

          {/* No Sale Reason */}
          {t.saleCompleted === false && t.noSaleReason && (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-6 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-red-700">Razón de No Venta</h3>
              </div>
              <p className="text-red-600 font-medium text-lg">{t.noSaleReason}</p>
            </div>
          )}

          {/* Products Discussed */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-[#1a1a2e]">Productos Discutidos</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {t.productsDiscussed?.length > 0 && t.productsDiscussed[0] ? (
                t.productsDiscussed.map((product, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                    {product}
                  </span>
                ))
              ) : (
                <p className="text-gray-400">Sin productos identificados</p>
              )}
            </div>
          </div>

          {/* Customer Objections */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-[#1a1a2e]">Objeciones del Cliente</h3>
            </div>
            <ul className="space-y-2">
              {t.customerObjections?.length > 0 && t.customerObjections[0] ? (
                t.customerObjections.map((objection, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <span className="text-orange-500 mt-1">•</span>
                    {objection}
                  </li>
                ))
              ) : (
                <p className="text-gray-400">Sin objeciones identificadas</p>
              )}
            </ul>
          </div>

          {/* Seller Strengths */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-[#1a1a2e]">Fortalezas</h3>
            </div>
            <ul className="space-y-2">
              {t.sellerStrengths?.length > 0 && t.sellerStrengths[0] ? (
                t.sellerStrengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))
              ) : (
                <p className="text-gray-400">Sin fortalezas identificadas</p>
              )}
            </ul>
          </div>

          {/* Seller Weaknesses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-[#1a1a2e]">Áreas de Mejora</h3>
            </div>
            <ul className="space-y-2">
              {t.sellerWeaknesses?.length > 0 && t.sellerWeaknesses[0] ? (
                t.sellerWeaknesses.map((weakness, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    {weakness}
                  </li>
                ))
              ) : (
                <p className="text-gray-400">Sin áreas de mejora identificadas</p>
              )}
            </ul>
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-yellow-800">Sugerencias de Mejora</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.improvementSuggestions?.length > 0 && t.improvementSuggestions[0] ? (
                t.improvementSuggestions.map((suggestion, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-yellow-200">
                    <p className="text-gray-700">{suggestion}</p>
                  </div>
                ))
              ) : (
                <p className="text-yellow-700">Sin sugerencias disponibles</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-[#1a1a2e] rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-[#1a1a2e] mb-2">Análisis pendiente</h3>
          <p className="text-gray-500 mb-6">
            Esta transcripción aún no ha sido analizada con inteligencia artificial
          </p>
          <button onClick={handleAnalyze} className="btn-primary inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Analizar ahora
          </button>
        </div>
      )}

      {/* Full Transcription */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="font-semibold text-[#1a1a2e]">Transcripción Completa</h3>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 max-h-96 overflow-auto">
          <pre className="whitespace-pre-wrap font-sans text-gray-600 text-sm leading-relaxed">
            {t.transcriptionText || 'Sin transcripción disponible'}
          </pre>
        </div>
      </div>
    </div>
  );
}
