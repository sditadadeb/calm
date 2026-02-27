import { useState, useEffect, useRef } from 'react';
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
  Quote,
  Volume2,
  VolumeX,
  Loader2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getTranscriptions } from '../api';
import api from '../api';

// Reproductor de audio personalizado con duración fija
function AudioPlayerCustom({ src, duration: initialDuration, isDark }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);

  useEffect(() => {
    if (initialDuration) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('durationchange', handleDurationChange);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs) => {
    if (!secs || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <audio ref={audioRef} src={src} preload="auto" />
      
      <button
        onClick={togglePlay}
        className="p-3 rounded-full bg-[#F5A623] hover:bg-[#D4911F] text-white transition-colors"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      <span className={`text-sm font-mono w-12 text-right ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
        {formatTime(currentTime)}
      </span>

      <div 
        className={`flex-1 h-2 rounded-full cursor-pointer relative ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}
        onClick={handleSeek}
      >
        <div 
          className="h-full bg-[#F5A623] rounded-full"
          style={{ width: `${progress}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-[#F5A623]"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>

      <span className={`text-sm font-mono w-12 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
        {formatTime(duration)}
      </span>
    </div>
  );
}
import ScoreBadge from '../components/ScoreBadge';
import { useTheme } from '../context/ThemeContext';
import { getTranscription, getAudioUrl, getAudioStreamUrl } from '../api';


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
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [audioLoading, setAudioLoading] = useState(true);
  
  // Navegación entre transcripciones
  const [allIds, setAllIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(null);
  const audioRef = useRef(null);
  
  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    const fetchTranscription = async () => {
      try {
        setLoading(true);
        const response = await getTranscription(id);
        setTranscription(response.data);
      } catch (err) {
        console.error('Error fetching transcription:', err);
        setError('Error al cargar la transcripción');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchAudioUrl = async () => {
      try {
        setAudioLoading(true);
        setAudioProgress(0);
        const response = await getAudioUrl(id);
        
        if (response.data.available) {
          // Descargar audio completo como blob para permitir seeking
          const streamUrl = getAudioStreamUrl(id);
          
          const xhr = new XMLHttpRequest();
          xhr.open('GET', streamUrl, true);
          xhr.responseType = 'blob';
          
          xhr.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setAudioProgress(percent);
            }
          };
          
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 206) {
              const blob = xhr.response;
              const blobUrl = URL.createObjectURL(blob);
              
              // Truco para obtener duración de webm: crear audio temporal y forzar seek
              const tempAudio = new Audio();
              tempAudio.preload = 'metadata';
              
              tempAudio.onloadedmetadata = () => {
                if (tempAudio.duration && isFinite(tempAudio.duration)) {
                  setAudioDuration(tempAudio.duration);
                  setAudioUrl(blobUrl);
                  setAudioAvailable(true);
                  setAudioLoading(false);
                } else {
                  // Si no hay duración, forzar seek al final
                  tempAudio.currentTime = Number.MAX_SAFE_INTEGER;
                }
              };
              
              tempAudio.ontimeupdate = () => {
                if (tempAudio.duration && isFinite(tempAudio.duration)) {
                  setAudioDuration(tempAudio.duration);
                  setAudioUrl(blobUrl);
                  setAudioAvailable(true);
                  setAudioLoading(false);
                  tempAudio.ontimeupdate = null;
                }
              };
              
              tempAudio.onerror = () => {
                // Aún sin duración, mostrar el reproductor
                setAudioUrl(blobUrl);
                setAudioAvailable(true);
                setAudioLoading(false);
              };
              
              tempAudio.src = blobUrl;
            } else {
              setAudioAvailable(false);
              setAudioLoading(false);
            }
          };
          
          xhr.onerror = () => {
            console.error('Error downloading audio');
            setAudioAvailable(false);
            setAudioLoading(false);
          };
          
          xhr.send();
        } else {
          setAudioAvailable(false);
          setAudioLoading(false);
        }
      } catch (err) {
        console.error('Error fetching audio URL:', err);
        setAudioAvailable(false);
        setAudioLoading(false);
      }
    };
    
    fetchTranscription();
    fetchAudioUrl();
    
    // Cleanup blob URL on unmount
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [id]);

  // Cargar lista de IDs para navegación
  useEffect(() => {
    const fetchAllIds = async () => {
      try {
        const response = await getTranscriptions({});
        const ids = response.data.map(t => t.recordingId);
        setAllIds(ids);
        const idx = ids.indexOf(id);
        setCurrentIndex(idx);
      } catch (err) {
        console.error('Error fetching transcription IDs:', err);
      }
    };
    fetchAllIds();
  }, [id]);

  // Comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        const response = await api.get(`/transcriptions/${id}/comments`);
        setComments(response.data);
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await api.post(`/transcriptions/${id}/comments`, { content: newComment.trim() });
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      await api.delete(`/transcriptions/${id}/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Navegación
  const goToPrevious = () => {
    if (currentIndex > 0) {
      navigate(`/transcriptions/${allIds[currentIndex - 1]}`);
    }
  };

  const goToNext = () => {
    if (currentIndex < allIds.length - 1) {
      navigate(`/transcriptions/${allIds[currentIndex + 1]}`);
    }
  };

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allIds.length - 1 && currentIndex >= 0;

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
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/transcriptions')}
          className={`flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-[#F5A623]' : 'text-gray-500 hover:text-[#F5A623]'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </button>
        
        {/* Flechas de navegación */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            disabled={!hasPrevious}
            className={`p-2 rounded-lg transition-colors ${
              hasPrevious 
                ? isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : isDark
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {allIds.length > 0 && (
            <span className={`text-sm px-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {currentIndex + 1} / {allIds.length}
            </span>
          )}
          
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className={`p-2 rounded-lg transition-colors ${
              hasNext 
                ? isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : isDark
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            title="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

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

      {/* Audio Player */}
      <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        {audioLoading ? (
          <div className="space-y-2">
            <div className={`flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Descargando audio... {audioProgress}%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <div 
                className="h-full bg-[#F5A623] transition-all duration-300"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </div>
        ) : audioAvailable ? (
          <AudioPlayerCustom 
            src={audioUrl} 
            duration={audioDuration} 
            isDark={isDark} 
          />
        ) : (
          <div className={`flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <VolumeX className="w-5 h-5" />
            <span className="text-sm">Audio no disponible para esta transcripción</span>
          </div>
        )}
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

      {/* Comments Thread */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <MessageSquare className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
          </div>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Comentarios {comments.length > 0 && `(${comments.length})`}
          </h3>
        </div>

        {/* Comment list */}
        <div className="space-y-3 mb-4">
          {commentsLoading ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Sin comentarios aún</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-[#F5A623]/20 text-[#F5A623]' : 'bg-[#F5A623]/20 text-[#F5A623]'}`}>
                      {c.authorUsername?.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{c.authorUsername}</span>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString('es-AR') : ''}
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                      title="Eliminar comentario"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{c.content}</p>
              </div>
            ))
          )}
        </div>

        {/* New comment input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Escribí un comentario..."
            className={`flex-1 px-4 py-2 rounded-lg border text-sm ${
              isDark 
                ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-[#F5A623]' 
                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#F5A623]'
            } focus:outline-none focus:ring-1 focus:ring-[#F5A623]/50`}
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
