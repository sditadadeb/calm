import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, Check, Star } from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';

export default function PublicSurvey() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = welcome
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSurvey();
  }, [publicId]);

  const fetchSurvey = async () => {
    try {
      const response = await api.get(`/surveys/public/${publicId}`);
      setSurvey(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar la encuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => {
        const question = survey.questions.find(q => q.id === parseInt(questionId));
        const answer = { questionId: parseInt(questionId) };
        
        if (['SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE'].includes(question.type)) {
          answer.textValue = value;
        } else if (['NPS', 'STAR_RATING', 'RATING_SCALE', 'SLIDER', 'NUMBER'].includes(question.type)) {
          answer.numericValue = parseFloat(value);
        } else if (['SINGLE_CHOICE', 'DROPDOWN'].includes(question.type)) {
          answer.selectedOptionIds = [parseInt(value)];
        } else if (['MULTIPLE_CHOICE'].includes(question.type)) {
          answer.selectedOptionIds = value.map(v => parseInt(v));
        }
        
        return answer;
      });

      await api.post(`/responses/submit/${publicId}`, { answers: formattedAnswers });
      navigate('/thank-you', { state: { message: survey.thankYouMessage } });
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar respuestas');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-bold text-white mb-2">Encuesta no disponible</h1>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  const questions = survey?.questions || [];
  const currentQuestion = currentIndex >= 0 ? questions[currentIndex] : null;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const renderQuestion = (question) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'SHORT_TEXT':
      case 'EMAIL':
      case 'PHONE':
        return (
          <input
            type={question.type === 'EMAIL' ? 'email' : question.type === 'PHONE' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            className="input text-lg"
            placeholder={question.placeholder || 'Tu respuesta...'}
          />
        );

      case 'LONG_TEXT':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            className="input text-lg"
            rows={4}
            placeholder={question.placeholder || 'Tu respuesta...'}
          />
        );

      case 'NPS':
        return (
          <div className="flex flex-wrap justify-center gap-2">
            {[...Array(11)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(question.id, i)}
                className={clsx(
                  'w-12 h-12 rounded-lg text-lg font-medium transition-all',
                  value === i 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                )}
              >
                {i}
              </button>
            ))}
            <div className="w-full flex justify-between text-sm text-white/50 mt-2">
              <span>Poco probable</span>
              <span>Muy probable</span>
            </div>
          </div>
        );

      case 'STAR_RATING':
        return (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleAnswer(question.id, star)}
                className="p-2 transition-transform hover:scale-110"
              >
                <Star
                  className={clsx(
                    'w-10 h-10 transition-colors',
                    value >= star ? 'fill-yellow-400 text-yellow-400' : 'text-white/30'
                  )}
                />
              </button>
            ))}
          </div>
        );

      case 'SINGLE_CHOICE':
      case 'DROPDOWN':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(question.id, option.id)}
                className={clsx(
                  'w-full p-4 rounded-xl text-left transition-all flex items-center gap-3',
                  value === option.id
                    ? 'bg-primary-500/20 border-2 border-primary-500'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                )}
              >
                <div className={clsx(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  value === option.id ? 'border-primary-500 bg-primary-500' : 'border-white/30'
                )}>
                  {value === option.id && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-white">{option.text}</span>
              </button>
            ))}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        const selectedValues = value || [];
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  const newValues = selectedValues.includes(option.id)
                    ? selectedValues.filter(v => v !== option.id)
                    : [...selectedValues, option.id];
                  handleAnswer(question.id, newValues);
                }}
                className={clsx(
                  'w-full p-4 rounded-xl text-left transition-all flex items-center gap-3',
                  selectedValues.includes(option.id)
                    ? 'bg-primary-500/20 border-2 border-primary-500'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                )}
              >
                <div className={clsx(
                  'w-6 h-6 rounded border-2 flex items-center justify-center',
                  selectedValues.includes(option.id) ? 'border-primary-500 bg-primary-500' : 'border-white/30'
                )}>
                  {selectedValues.includes(option.id) && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-white">{option.text}</span>
              </button>
            ))}
          </div>
        );

      default:
        return <p className="text-white/50">Tipo de pregunta no soportado</p>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      {survey?.showProgressBar && currentIndex >= 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Welcome screen */}
          {currentIndex === -1 && (
            <div className="card text-center animate-fade-in">
              {survey?.logoUrl && (
                <img src={survey.logoUrl} alt="" className="h-16 mx-auto mb-6" />
              )}
              <h1 className="font-display text-3xl font-bold text-white mb-4">{survey?.title}</h1>
              {survey?.description && (
                <p className="text-white/70 mb-6">{survey.description}</p>
              )}
              {survey?.welcomeMessage && (
                <p className="text-white/60 mb-8">{survey.welcomeMessage}</p>
              )}
              <button
                onClick={() => setCurrentIndex(0)}
                className="btn-primary text-lg px-8 py-3"
              >
                Comenzar
              </button>
            </div>
          )}

          {/* Questions */}
          {currentIndex >= 0 && currentQuestion && (
            <div className="card animate-fade-in">
              <div className="mb-2 text-sm text-white/50">
                Pregunta {currentIndex + 1} de {questions.length}
              </div>
              <h2 className="text-xl font-semibold text-white mb-6">
                {currentQuestion.text}
                {currentQuestion.required && <span className="text-accent-400 ml-1">*</span>}
              </h2>
              {currentQuestion.description && (
                <p className="text-white/60 mb-4">{currentQuestion.description}</p>
              )}
              
              {renderQuestion(currentQuestion)}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="btn-secondary flex items-center gap-2"
                  disabled={currentIndex === 0 && !survey?.allowBackNavigation}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="btn-primary flex items-center gap-2"
                    disabled={currentQuestion.required && !answers[currentQuestion.id]}
                  >
                    Siguiente
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || (currentQuestion.required && !answers[currentQuestion.id])}
                    className="btn-accent flex items-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Enviar
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

