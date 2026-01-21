import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, MoreVertical, Edit, Trash2, BarChart3, 
  Send, Copy, ExternalLink, Loader2, ClipboardList
} from 'lucide-react';
import useSurveyStore from '../stores/surveyStore';
import clsx from 'clsx';

export default function Surveys() {
  const { surveys, fetchSurveys, deleteSurvey, publishSurvey, closeSurvey, loading } = useSurveyStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurveys();
  }, []);

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || survey.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta encuesta?')) {
      await deleteSurvey(id);
    }
    setMenuOpen(null);
  };

  const handlePublish = async (id) => {
    await publishSurvey(id);
    setMenuOpen(null);
  };

  const handleClose = async (id) => {
    await closeSurvey(id);
    setMenuOpen(null);
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    setMenuOpen(null);
  };

  const statusColors = {
    DRAFT: 'bg-yellow-500/20 text-yellow-400',
    ACTIVE: 'bg-green-500/20 text-green-400',
    PAUSED: 'bg-orange-500/20 text-orange-400',
    CLOSED: 'bg-red-500/20 text-red-400',
    ARCHIVED: 'bg-gray-500/20 text-gray-400'
  };

  const statusLabels = {
    DRAFT: 'Borrador',
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    CLOSED: 'Cerrada',
    ARCHIVED: 'Archivada'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Encuestas</h1>
          <p className="text-white/60">Gestiona tus encuestas</p>
        </div>
        <Link to="/surveys/new" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Nueva Encuesta
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
            placeholder="Buscar encuestas..."
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">Todas</option>
          <option value="DRAFT">Borradores</option>
          <option value="ACTIVE">Activas</option>
          <option value="CLOSED">Cerradas</option>
        </select>
      </div>

      {/* Survey List */}
      {loading && surveys.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : filteredSurveys.length > 0 ? (
        <div className="grid gap-4">
          {filteredSurveys.map((survey) => (
            <div key={survey.id} className="card hover:border-primary-500/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white text-lg">{survey.title}</h3>
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[survey.status])}>
                      {statusLabels[survey.status]}
                    </span>
                  </div>
                  {survey.description && (
                    <p className="text-sm text-white/50 line-clamp-1 mb-3">{survey.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <span>{survey.questionCount || 0} preguntas</span>
                    <span>{survey.totalResponses || 0} respuestas</span>
                    {survey.completionRate && (
                      <span>{survey.completionRate.toFixed(1)}% completadas</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/surveys/${survey.id}/analytics`}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </Link>
                  <Link
                    to={`/surveys/${survey.id}/edit`}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                  
                  {/* More menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === survey.id ? null : survey.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-white/60" />
                    </button>
                    
                    {menuOpen === survey.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 py-2 glass rounded-xl shadow-xl z-20">
                          {survey.status === 'DRAFT' && (
                            <button
                              onClick={() => handlePublish(survey.id)}
                              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Publicar
                            </button>
                          )}
                          {survey.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleClose(survey.id)}
                              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 flex items-center gap-2"
                            >
                              <ClipboardList className="w-4 h-4" />
                              Cerrar
                            </button>
                          )}
                          {survey.surveyUrl && (
                            <>
                              <button
                                onClick={() => copyLink(survey.surveyUrl)}
                                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Copiar enlace
                              </button>
                              <a
                                href={survey.surveyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Ver encuesta
                              </a>
                            </>
                          )}
                          <hr className="my-2 border-white/10" />
                          <button
                            onClick={() => handleDelete(survey.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <ClipboardList className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {search || filter !== 'all' ? 'No se encontraron encuestas' : 'No tienes encuestas aún'}
          </h3>
          <p className="text-white/50 mb-6">
            {search || filter !== 'all' 
              ? 'Intenta con otros filtros de búsqueda' 
              : 'Crea tu primera encuesta para empezar a recolectar feedback'}
          </p>
          <Link to="/surveys/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Crear Encuesta
          </Link>
        </div>
      )}
    </div>
  );
}

