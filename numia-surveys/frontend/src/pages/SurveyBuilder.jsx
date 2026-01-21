import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, ArrowLeft, Plus, Trash2, GripVertical, Settings,
  Type, AlignLeft, List, CheckSquare, Star, Hash,
  Calendar, Mail, Phone, Loader2, Eye, Send, Sliders
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useSurveyStore from '../stores/surveyStore';
import clsx from 'clsx';

const questionTypes = [
  { type: 'SHORT_TEXT', icon: Type, label: 'Texto corto' },
  { type: 'LONG_TEXT', icon: AlignLeft, label: 'Texto largo' },
  { type: 'SINGLE_CHOICE', icon: List, label: 'Opción única' },
  { type: 'MULTIPLE_CHOICE', icon: CheckSquare, label: 'Opción múltiple' },
  { type: 'DROPDOWN', icon: List, label: 'Desplegable' },
  { type: 'NPS', icon: Hash, label: 'NPS (0-10)' },
  { type: 'CSAT', icon: Star, label: 'CSAT (1-5)' },
  { type: 'STAR_RATING', icon: Star, label: 'Estrellas' },
  { type: 'RATING_SCALE', icon: Sliders, label: 'Escala' },
  { type: 'DATE', icon: Calendar, label: 'Fecha' },
  { type: 'EMAIL', icon: Mail, label: 'Email' },
  { type: 'PHONE', icon: Phone, label: 'Teléfono' },
];

const SortableQuestion = ({ question, onUpdate, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: question.id 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(question);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    const result = await onUpdate(question.id, editData);
    if (result.success) {
      setIsEditing(false);
    } else {
      alert(result.error || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    setDeleting(true);
    const result = await onDelete(question.id);
    if (!result.success) {
      alert(result.error || 'Error al eliminar');
      setDeleting(false);
    }
  };

  const typeConfig = questionTypes.find(t => t.type === question.type);
  const Icon = typeConfig?.icon || Type;

  // Inicializar opciones por defecto para tipos de selección
  const initOptionsIfNeeded = () => {
    if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(editData.type) && (!editData.options || editData.options.length === 0)) {
      setEditData({ ...editData, options: [{ text: 'Opción 1', orderIndex: 0 }, { text: 'Opción 2', orderIndex: 1 }] });
    }
  };

  // Renderizar preview según el tipo
  const renderTypePreview = () => {
    switch (question.type) {
      case 'NPS':
        return (
          <div className="flex gap-1 mt-2">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded bg-white/10 text-[10px] flex items-center justify-center text-white/40">
                {i}
              </div>
            ))}
          </div>
        );
      case 'STAR_RATING':
        return (
          <div className="flex gap-1 mt-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-5 h-5 text-white/30" />
            ))}
          </div>
        );
      case 'SINGLE_CHOICE':
      case 'DROPDOWN':
        return question.options?.length > 0 ? (
          <div className="mt-2 space-y-1">
            {question.options.slice(0, 4).map((opt, idx) => (
              <div key={idx} className="text-sm text-white/50 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-white/30" />
                {opt.text}
              </div>
            ))}
            {question.options.length > 4 && (
              <p className="text-xs text-white/40">+{question.options.length - 4} más</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-white/40 mt-2 italic">Sin opciones configuradas</p>
        );
      case 'MULTIPLE_CHOICE':
        return question.options?.length > 0 ? (
          <div className="mt-2 space-y-1">
            {question.options.slice(0, 4).map((opt, idx) => (
              <div key={idx} className="text-sm text-white/50 flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-white/30" />
                {opt.text}
              </div>
            ))}
            {question.options.length > 4 && (
              <p className="text-xs text-white/40">+{question.options.length - 4} más</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-white/40 mt-2 italic">Sin opciones configuradas</p>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'card mb-3 transition-all',
        isDragging && 'opacity-50 scale-[1.02]',
        deleting && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-white/30 hover:text-white/50" />
        </button>
        
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editData.text}
                onChange={(e) => setEditData({ ...editData, text: e.target.value })}
                className="input"
                placeholder="Texto de la pregunta"
                autoFocus
              />
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={editData.required || false}
                    onChange={(e) => setEditData({ ...editData, required: e.target.checked })}
                    className="rounded border-white/30"
                  />
                  Requerida
                </label>
              </div>

              {['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(editData.type) && (
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Opciones de respuesta</label>
                  {(editData.options || []).map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-white/40 w-6 text-center pt-2">{idx + 1}.</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOptions = [...editData.options];
                          newOptions[idx] = { ...opt, text: e.target.value };
                          setEditData({ ...editData, options: newOptions });
                        }}
                        className="input flex-1"
                        placeholder={`Opción ${idx + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newOptions = editData.options.filter((_, i) => i !== idx);
                          setEditData({ ...editData, options: newOptions });
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                        disabled={editData.options.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(editData.options || []), { text: '', orderIndex: editData.options?.length || 0 }];
                      setEditData({ ...editData, options: newOptions });
                    }}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar opción
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="btn-primary text-sm">
                  Guardar
                </button>
                <button onClick={() => { setIsEditing(false); setEditData(question); }} className="btn-secondary text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div onClick={() => { setIsEditing(true); initOptionsIfNeeded(); }} className="cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-primary-400" />
                <span className="text-xs text-white/50">{typeConfig?.label}</span>
                {question.required && (
                  <span className="text-xs text-accent-400">* requerida</span>
                )}
              </div>
              <p className="text-white font-medium">{question.text || 'Nueva pregunta (clic para editar)'}</p>
              {renderTypePreview()}
            </div>
          )}
        </div>
        
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function SurveyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    currentSurvey, fetchSurvey, createSurvey, updateSurvey, 
    addQuestion, updateQuestion, deleteQuestion, reorderQuestions,
    publishSurvey, loading, clearCurrentSurvey 
  } = useSurveyStore();
  
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    welcomeMessage: '',
    thankYouMessage: 'Gracias por completar nuestra encuesta.',
    allowAnonymous: true,
    showProgressBar: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id) {
      fetchSurvey(id);
    } else {
      clearCurrentSurvey();
    }
  }, [id]);

  useEffect(() => {
    if (currentSurvey) {
      setSurveyData({
        title: currentSurvey.title || '',
        description: currentSurvey.description || '',
        welcomeMessage: currentSurvey.welcomeMessage || '',
        thankYouMessage: currentSurvey.thankYouMessage || 'Gracias por completar nuestra encuesta.',
        allowAnonymous: currentSurvey.allowAnonymous ?? true,
        showProgressBar: currentSurvey.showProgressBar ?? true,
      });
    }
  }, [currentSurvey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id) {
        await updateSurvey(id, surveyData);
      } else {
        const result = await createSurvey(surveyData);
        if (result.success) {
          navigate(`/surveys/${result.data.id}/edit`, { replace: true });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (type) => {
    if (!id && !currentSurvey?.id) {
      const result = await createSurvey(surveyData);
      if (result.success) {
        navigate(`/surveys/${result.data.id}/edit`, { replace: true });
        await addQuestion(result.data.id, { text: 'Nueva pregunta', type, required: false });
      }
    } else {
      await addQuestion(currentSurvey.id, { text: 'Nueva pregunta', type, required: false });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id && currentSurvey?.questions) {
      const oldIndex = currentSurvey.questions.findIndex(q => q.id === active.id);
      const newIndex = currentSurvey.questions.findIndex(q => q.id === over.id);
      
      const newOrder = [...currentSurvey.questions];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);
      
      await reorderQuestions(currentSurvey.id, newOrder.map(q => q.id));
      fetchSurvey(currentSurvey.id);
    }
  };

  const handlePublish = async () => {
    if (currentSurvey?.id) {
      const result = await publishSurvey(currentSurvey.id);
      if (result.success) {
        navigate('/surveys');
      }
    }
  };

  if (loading && id && !currentSurvey) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/surveys')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-secondary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
          {currentSurvey?.status === 'DRAFT' && currentSurvey?.questions?.length > 0 && (
            <button
              onClick={handlePublish}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Publicar
            </button>
          )}
        </div>
      </div>

      {/* Survey Info */}
      <div className="card mb-6">
        <input
          type="text"
          value={surveyData.title}
          onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-white/30 focus:outline-none mb-3"
          placeholder="Título de la encuesta"
        />
        <textarea
          value={surveyData.description}
          onChange={(e) => setSurveyData({ ...surveyData, description: e.target.value })}
          className="w-full bg-transparent text-white/70 placeholder-white/30 focus:outline-none resize-none"
          placeholder="Descripción (opcional)"
          rows={2}
        />
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-white mb-4">Configuración</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Mensaje de bienvenida</label>
              <textarea
                value={surveyData.welcomeMessage}
                onChange={(e) => setSurveyData({ ...surveyData, welcomeMessage: e.target.value })}
                className="input"
                rows={2}
                placeholder="Mensaje al inicio de la encuesta"
              />
            </div>
            <div>
              <label className="label">Mensaje de agradecimiento</label>
              <textarea
                value={surveyData.thankYouMessage}
                onChange={(e) => setSurveyData({ ...surveyData, thankYouMessage: e.target.value })}
                className="input"
                rows={2}
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-white/70">
                <input
                  type="checkbox"
                  checked={surveyData.allowAnonymous}
                  onChange={(e) => setSurveyData({ ...surveyData, allowAnonymous: e.target.checked })}
                  className="rounded"
                />
                Permitir respuestas anónimas
              </label>
              <label className="flex items-center gap-2 text-white/70">
                <input
                  type="checkbox"
                  checked={surveyData.showProgressBar}
                  onChange={(e) => setSurveyData({ ...surveyData, showProgressBar: e.target.checked })}
                  className="rounded"
                />
                Mostrar barra de progreso
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Preguntas</h3>
        
        {currentSurvey?.questions?.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={currentSurvey.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
              {currentSurvey.questions.map((question) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="card text-center py-8 border-2 border-dashed border-white/20">
            <p className="text-white/50 mb-4">Agrega preguntas para comenzar</p>
          </div>
        )}
      </div>

      {/* Add Question */}
      <div className="card">
        <h4 className="text-sm font-medium text-white/70 mb-3">Agregar pregunta</h4>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {questionTypes.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => handleAddQuestion(type)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Icon className="w-5 h-5 text-primary-400" />
              <span className="text-xs text-white/70">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

