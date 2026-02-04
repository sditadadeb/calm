import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  Target,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  FileText,
  TrendingUp,
  HelpCircle,
  Shield,
  Quote
} from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

// Mapeo de saleStatus a labels y colores
const SALE_STATUS_CONFIG = {
  SALE_CONFIRMED: {
    label: 'Venta Confirmada',
    icon: CheckCircle,
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    description: 'Venta explícitamente confirmada con evidencia clara'
  },
  SALE_LIKELY: {
    label: 'Venta Probable',
    icon: TrendingUp,
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    description: 'Alta probabilidad de venta, sin confirmación explícita grabada'
  },
  ADVANCE_NO_CLOSE: {
    label: 'Avance Comercial',
    icon: AlertTriangle,
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-400',
    description: 'Cliente interesado pero sin cierre en esta interacción'
  },
  NO_SALE: {
    label: 'Sin Venta',
    icon: XCircle,
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    description: 'No se concretó la venta'
  },
  UNINTERPRETABLE: {
    label: 'No Interpretable',
    icon: HelpCircle,
    bgClass: 'bg-slate-500/20',
    textClass: 'text-slate-400',
    description: 'Transcripción no permite determinar resultado'
  }
};

export default function TranscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTranscription = async () => {
      try {
        setLoading(true);
        const response = await api.getTranscription(id);
        setTranscription(response.data);
      } catch (err) {
        console.error('Error fetching transcription:', err);
        setError('Error al cargar la transcripción');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTranscription();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // Obtener configuración del status
  const getStatusConfig = (status) => {
    return SALE_STATUS_CONFIG[status] || SALE_STATUS_CONFIG.NO_SALE;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando transcripción...</p>
        </div>
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{error || 'Transcripción no encontrada'}</p>
          <button
            onClick={() => navigate('/transcriptions')}
            className="mt-4 px-4 py-2 bg-[#F5A623] text-white rounded-lg hover:opacity-90"
          >
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  const t = transcription;
  const statusConfig = getStatusConfig(t.saleStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Button */}
      <button
        onClick={() => navigate('/transcriptions')}
        className={`flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-[#F5A623]' : 'text-gray-500 hover:text-[#F5A623]'}`}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al listado
      </button>

      {/* Header Card */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xl font-bold text-[#F5A623]">{t.recordingId}</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                <StatusIcon className="w-4 h-4" /> {statusConfig.label}
              </span>
            </div>
            
            <div className={`flex flex-wrap items-center gap-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{t.userName || 'Sin vendedor'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{t.branchName || 'Sin sucursal'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(t.recordingDate)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div>
              <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Score de Atención</p>
              <ScoreBadge score={t.sellerScore} />
            </div>
            
            {/* Analysis Confidence */}
            {t.analysisConfidence !== null && t.analysisConfidence !== undefined && (
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Confianza del análisis:
                </span>
                <div className={`h-2 w-20 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-full rounded-full ${
                      t.analysisConfidence >= 70 ? 'bg-green-500' : 
                      t.analysisConfidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${t.analysisConfidence}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold ${
                  t.analysisConfidence >= 70 ? 'text-green-500' : 
                  t.analysisConfidence >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {t.analysisConfidence}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executive Summary */}
        {t.executiveSummary && (
          <div className={`rounded-2xl border p-6 lg:col-span-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#F5A623] rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Resumen Ejecutivo</h3>
            </div>
            <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.executiveSummary}</p>
          </div>
        )}

        {/* Sale Evidence */}
        {t.saleEvidence && (
          <div className={`rounded-2xl border p-6 lg:col-span-2 ${
            t.saleCompleted 
              ? (isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100')
              : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100')
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${t.saleCompleted ? 'bg-green-500' : (isDark ? 'bg-slate-600' : 'bg-gray-400')}`}>
                <Quote className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Evidencia de {t.saleCompleted ? 'Venta' : 'Resultado'}
              </h3>
            </div>
            <p className={`italic text-lg ${
              t.saleCompleted 
                ? (isDark ? 'text-green-300' : 'text-green-700')
                : (isDark ? 'text-slate-300' : 'text-gray-600')
            }`}>
              "{t.saleEvidence}"
            </p>
          </div>
        )}

        {/* No Sale Reason */}
        {!t.saleCompleted && t.noSaleReason && (
          <div className={`rounded-2xl border p-6 lg:col-span-2 ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>Razón de No Venta</h3>
            </div>
            <p className={`font-medium text-lg ${isDark ? 'text-red-400' : 'text-red-600'}`}>{t.noSaleReason}</p>
          </div>
        )}

        {/* Products Discussed */}
        {t.productsDiscussed && t.productsDiscussed.length > 0 && t.productsDiscussed[0] !== '' && (
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Productos Discutidos</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {t.productsDiscussed.map((prod, i) => (
                <span key={i} className={`px-4 py-2 rounded-full font-medium ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  {prod}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Customer Objections */}
        {t.customerObjections && t.customerObjections.length > 0 && t.customerObjections[0] !== '' && (
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Objeciones del Cliente</h3>
            </div>
            <ul className="space-y-2">
              {t.customerObjections.map((obj, i) => (
                <li key={i} className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <span className="text-orange-500 mt-1">•</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Seller Strengths */}
        {t.sellerStrengths && t.sellerStrengths.length > 0 && t.sellerStrengths[0] !== '' && (
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Fortalezas del Vendedor</h3>
            </div>
            <ul className="space-y-2">
              {t.sellerStrengths.map((f, i) => (
                <li key={i} className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Seller Weaknesses */}
        {t.sellerWeaknesses && t.sellerWeaknesses.length > 0 && t.sellerWeaknesses[0] !== '' && (
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Áreas de Mejora</h3>
            </div>
            <ul className="space-y-2">
              {t.sellerWeaknesses.map((d, i) => (
                <li key={i} className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement Suggestions */}
        {t.improvementSuggestions && t.improvementSuggestions.length > 0 && t.improvementSuggestions[0] !== '' && (
          <div className={`rounded-2xl border p-6 lg:col-span-2 ${isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Sugerencias de Mejora</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.improvementSuggestions.map((s, i) => (
                <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-amber-800/50' : 'bg-white border-amber-200'}`}>
                  <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Transcription */}
      {t.transcriptionText && (
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <MessageSquare className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
            </div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Transcripción Completa</h3>
          </div>
          <div className={`rounded-xl p-6 max-h-96 overflow-auto ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              {t.transcriptionText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
