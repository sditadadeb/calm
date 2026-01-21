import { useState, useEffect } from 'react';
import { Plus, Send, Mail, Smartphone, Link as LinkIcon, Loader2, Clock } from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';

export default function Distributions() {
  const [distributions, setDistributions] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '',
    channel: 'EMAIL',
    surveyId: '',
    contactListId: '',
    subject: '',
    messageTemplate: 'Te invitamos a completar nuestra encuesta.',
    sendImmediately: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [distRes, surveyRes, listRes] = await Promise.all([
        api.get('/distributions'),
        api.get('/surveys'),
        api.get('/contacts/lists')
      ]);
      setDistributions(distRes.data);
      setSurveys(surveyRes.data.filter(s => s.status === 'ACTIVE'));
      setContactLists(listRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createDistribution = async () => {
    if (!form.name || !form.surveyId || !form.contactListId) {
      alert('Completa todos los campos requeridos');
      return;
    }
    
    try {
      const response = await api.post('/distributions', {
        ...form,
        surveyId: parseInt(form.surveyId),
        contactListId: parseInt(form.contactListId)
      });
      setDistributions([response.data, ...distributions]);
      setShowNew(false);
      setForm({
        name: '',
        channel: 'EMAIL',
        surveyId: '',
        contactListId: '',
        subject: '',
        messageTemplate: 'Te invitamos a completar nuestra encuesta.',
        sendImmediately: true
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Error al crear distribución');
    }
  };

  const channelIcons = {
    EMAIL: Mail,
    SMS: Smartphone,
    LINK: LinkIcon
  };

  const statusColors = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    COMPLETED: 'bg-green-500/20 text-green-400',
    FAILED: 'bg-red-500/20 text-red-400',
    CANCELLED: 'bg-gray-500/20 text-gray-400'
  };

  const statusLabels = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completada',
    FAILED: 'Fallida',
    CANCELLED: 'Cancelada'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Distribuciones</h1>
          <p className="text-white/60">Envía encuestas por email o SMS</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva Distribución
        </button>
      </div>

      {/* New Distribution Form */}
      {showNew && (
        <div className="card animate-slide-up">
          <h3 className="text-lg font-semibold text-white mb-4">Nueva Distribución</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Ej: Campaña Enero 2024"
              />
            </div>
            <div>
              <label className="label">Canal *</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="input"
              >
                <option value="EMAIL">Email (Mailgun)</option>
                <option value="SMS">SMS (Bulk SMS)</option>
              </select>
            </div>
            <div>
              <label className="label">Encuesta *</label>
              <select
                value={form.surveyId}
                onChange={(e) => setForm({ ...form, surveyId: e.target.value })}
                className="input"
              >
                <option value="">Seleccionar encuesta</option>
                {surveys.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Lista de Contactos *</label>
              <select
                value={form.contactListId}
                onChange={(e) => setForm({ ...form, contactListId: e.target.value })}
                className="input"
              >
                <option value="">Seleccionar lista</option>
                {contactLists.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.contactCount})</option>
                ))}
              </select>
            </div>
            {form.channel === 'EMAIL' && (
              <div className="md:col-span-2">
                <label className="label">Asunto del Email</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input"
                  placeholder="Invitación a encuesta"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="label">Mensaje</label>
              <textarea
                value={form.messageTemplate}
                onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                checked={form.sendImmediately}
                onChange={(e) => setForm({ ...form, sendImmediately: e.target.checked })}
                className="rounded"
              />
              Enviar inmediatamente
            </label>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={createDistribution} className="btn-primary flex items-center gap-2">
              <Send className="w-4 h-4" />
              Crear y Enviar
            </button>
            <button onClick={() => setShowNew(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Distributions List */}
      {distributions.length > 0 ? (
        <div className="space-y-4">
          {distributions.map((dist) => {
            const Icon = channelIcons[dist.channel] || Mail;
            return (
              <div key={dist.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{dist.name}</h3>
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[dist.status])}>
                          {statusLabels[dist.status]}
                        </span>
                      </div>
                      <p className="text-sm text-white/50">{dist.surveyTitle}</p>
                      <p className="text-xs text-white/40">{dist.contactListName}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{dist.sentCount || 0}</p>
                      <p className="text-xs text-white/50">Enviados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{dist.deliveredCount || 0}</p>
                      <p className="text-xs text-white/50">Entregados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{dist.openedCount || 0}</p>
                      <p className="text-xs text-white/50">Abiertos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-primary-400">{dist.respondedCount || 0}</p>
                      <p className="text-xs text-white/50">Respuestas</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Send className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No hay distribuciones</h3>
          <p className="text-white/50 mb-6">Crea tu primera distribución para enviar encuestas</p>
          <button onClick={() => setShowNew(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nueva Distribución
          </button>
        </div>
      )}
    </div>
  );
}

