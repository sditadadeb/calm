import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { Plus, Trash2, Calendar, ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  getTimelineEvents, createTimelineEvent, deleteTimelineEvent,
  getTimelineMetrics, getTimelineCompare, getSellers
} from '../api';

const CATEGORIES = [
  { value: 'capacitacion', label: 'Capacitación', color: '#3B82F6' },
  { value: 'proceso', label: 'Proceso', color: '#8B5CF6' },
  { value: 'producto', label: 'Producto', color: '#10B981' },
  { value: 'equipo', label: 'Equipo', color: '#F59E0B' },
  { value: 'otro', label: 'Otro', color: '#6B7280' },
];

const METRIC_OPTIONS = [
  { key: 'saleRate', label: 'Tasa de venta (%)', color: '#10B981' },
  { key: 'avgScore', label: 'Score promedio', color: '#F5A623' },
  { key: 'avgConfidence', label: 'Confianza promedio', color: '#3B82F6' },
  { key: 'total', label: 'Cantidad de atenciones', color: '#8B5CF6' },
];

function getCategoryInfo(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[4];
}

function DeltaBadge({ before, after, suffix = '', invert = false }) {
  if (before == null || after == null || before === 0) return <span className="text-gray-400">-</span>;
  const diff = after - before;
  const pct = Math.round((diff / before) * 100);
  const isPositive = invert ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;

  if (isNeutral) return (
    <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
      <Minus className="w-3 h-3" /> 0{suffix}
    </span>
  );

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {diff > 0 ? '+' : ''}{Math.round(diff * 10) / 10}{suffix} ({pct > 0 ? '+' : ''}{pct}%)
    </span>
  );
}

export default function Timeline() {
  const { isDark } = useTheme();
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [groupBy, setGroupBy] = useState('week');
  const [sellerId, setSellerId] = useState('');
  const [activeMetrics, setActiveMetrics] = useState(['saleRate', 'avgScore']);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'capacitacion', eventDate: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evRes, meRes, seRes] = await Promise.all([
        getTimelineEvents(),
        getTimelineMetrics(groupBy, sellerId || null),
        getSellers()
      ]);
      setEvents(evRes.data);
      setMetrics(meRes.data.series || []);
      setSellers(seRes.data);
    } catch (err) {
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [groupBy, sellerId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.eventDate) return;
    try {
      await createTimelineEvent(form);
      setForm({ title: '', description: '', category: 'capacitacion', eventDate: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await deleteTimelineEvent(id);
      if (selectedEvent?.id === id) { setSelectedEvent(null); setComparison(null); }
      loadData();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleSelectEvent = async (ev) => {
    if (selectedEvent?.id === ev.id) {
      setSelectedEvent(null);
      setComparison(null);
      return;
    }
    setSelectedEvent(ev);
    setLoadingCompare(true);
    try {
      const { data } = await getTimelineCompare(ev.eventDate, 14, sellerId || null);
      setComparison(data);
    } catch (err) {
      console.error('Error comparing:', err);
    } finally {
      setLoadingCompare(false);
    }
  };

  const toggleMetric = (key) => {
    setActiveMetrics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const chartData = useMemo(() => {
    return metrics.map(m => ({
      ...m,
      label: groupBy === 'month'
        ? new Date(m.period + '-01').toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
        : new Date(m.period).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    }));
  }, [metrics, groupBy]);

  const cardClass = `rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-[#F5A623]`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Agrupar por</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Vendedor</label>
          <select value={sellerId} onChange={e => setSellerId(e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
            <option value="">Todos</option>
            {sellers.map(s => <option key={s.userId} value={s.userId}>{s.userName}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {METRIC_OPTIONS.map(m => (
            <button key={m.key} onClick={() => toggleMetric(m.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeMetrics.includes(m.key)
                  ? 'text-white border-transparent'
                  : isDark
                    ? 'text-slate-400 border-slate-600 bg-transparent hover:border-slate-500'
                    : 'text-gray-500 border-gray-300 bg-transparent hover:border-gray-400'
              }`}
              style={activeMetrics.includes(m.key) ? { backgroundColor: m.color } : {}}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className={cardClass}>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className={isDark ? 'text-slate-500' : 'text-gray-400'}>No hay datos suficientes para el gráfico</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E5E7EB'} />
              <XAxis dataKey="label" tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1E293B' : '#FFF',
                  border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                  borderRadius: '12px',
                  color: isDark ? '#F1F5F9' : '#111827'
                }}
              />
              <Legend />
              {METRIC_OPTIONS.filter(m => activeMetrics.includes(m.key)).map(m => (
                <Line key={m.key} type="monotone" dataKey={m.key} name={m.label}
                  stroke={m.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
              {events.map(ev => (
                <ReferenceLine key={ev.id} x={
                  chartData.find(d => d.period === ev.eventDate || d.period <= ev.eventDate)?.label
                } stroke={getCategoryInfo(ev.category).color} strokeDasharray="5 5" strokeWidth={2}
                  label={{ value: ev.title, position: 'top', fill: getCategoryInfo(ev.category).color, fontSize: 11 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Comparison card */}
      {selectedEvent && (
        <div className={`${cardClass} border-l-4`} style={{ borderLeftColor: getCategoryInfo(selectedEvent.category).color }}>
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-[#F5A623]" />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Impacto: {selectedEvent.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
              14 días antes vs 14 días después
            </span>
          </div>
          {loadingCompare ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F5A623]"></div>
            </div>
          ) : comparison ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Atenciones</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {comparison.before.total} → {comparison.after.total}
                </p>
                <DeltaBadge before={comparison.before.total} after={comparison.after.total} />
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Tasa de venta</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {comparison.before.saleRate}% → {comparison.after.saleRate}%
                </p>
                <DeltaBadge before={comparison.before.saleRate} after={comparison.after.saleRate} suffix="%" />
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Score promedio</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {comparison.before.avgScore} → {comparison.after.avgScore}
                </p>
                <DeltaBadge before={comparison.before.avgScore} after={comparison.after.avgScore} suffix=" pts" />
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Ventas</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {comparison.before.sales} → {comparison.after.sales}
                </p>
                <DeltaBadge before={comparison.before.sales} after={comparison.after.sales} />
              </div>
            </div>
          ) : (
            <p className={isDark ? 'text-slate-500' : 'text-gray-400'}>Sin datos para comparar</p>
          )}
        </div>
      )}

      {/* Events */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Eventos registrados</h3>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#F5A623] hover:bg-[#D4911F] transition-colors">
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancelar' : 'Nuevo evento'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Título *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Capacitación upselling" className={inputClass} required />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Fecha *</label>
                <input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Categoría</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Descripción</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalle opcional..." className={inputClass} />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button type="submit"
                className="px-6 py-2 rounded-xl text-sm font-medium text-white bg-[#F5A623] hover:bg-[#D4911F] transition-colors">
                Guardar evento
              </button>
            </div>
          </form>
        )}

        {events.length === 0 && !showForm ? (
          <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay eventos registrados</p>
            <p className="text-sm mt-1">Agregá hitos para medir el impacto de tus acciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => {
              const cat = getCategoryInfo(ev.category);
              const isSelected = selectedEvent?.id === ev.id;
              return (
                <div key={ev.id}
                  onClick={() => handleSelectEvent(ev)}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? isDark ? 'bg-slate-700 border-[#F5A623]/50' : 'bg-orange-50 border-[#F5A623]/50'
                      : isDark ? 'bg-slate-700/30 border-transparent hover:bg-slate-700/60' : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}>
                  <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{ev.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                        {cat.label}
                      </span>
                    </div>
                    {ev.description && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{ev.description}</p>
                    )}
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {new Date(ev.eventDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-slate-600' : 'text-gray-400 hover:text-red-500 hover:bg-gray-200'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
