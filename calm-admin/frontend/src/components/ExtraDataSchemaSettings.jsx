import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, RotateCcw, Building2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getExtraDataSchema, updateExtraDataSchema, resetExtraDataSchemaTemplate, getBranches } from '../api';
import { FIELD_TYPES, slugifyId, branchKey } from './ExtraDataFields';

const emptyField = (order) => ({
  _key: crypto.randomUUID(),
  id: '',
  label: '',
  type: 'text',
  order,
  required: false,
  options: [],
});

function withStableKeys(fields) {
  return (fields || []).map((f) => ({
    ...f,
    _key: f._key || f.id || crypto.randomUUID(),
  }));
}

function stripClientKey(field) {
  const { _key, ...rest } = field;
  return rest;
}

export default function ExtraDataSchemaSettings({ onMessage }) {
  const { isDark } = useTheme();
  const [branches, setBranches] = useState([]);
  const [selectedBranchKey, setSelectedBranchKey] = useState('');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedBranch = useMemo(
    () => branches.find((b) => branchKey(b) === selectedBranchKey) ?? null,
    [branches, selectedBranchKey]
  );

  const inputClass = `w-full px-3 py-2 rounded-md border text-sm ${
    isDark ? 'bg-ink-overlay border-line-strong text-white' : 'bg-white border-gray-300 text-gray-800'
  } focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent`;

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadSchema(selectedBranch);
    } else {
      setFields([]);
    }
  }, [selectedBranchKey, branches]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await getBranches();
      const list = (res.data || []).map((b) => ({
        id: b.id,
        name: b.name ?? b.branchName,
      }));
      setBranches(list);
      if (!selectedBranchKey && list.length > 0) {
        setSelectedBranchKey(branchKey(list[0]));
      }
    } catch {
      onMessage?.({ type: 'error', text: 'Error al cargar sucursales' });
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = async (branch) => {
    try {
      setLoadingFields(true);
      const res = await getExtraDataSchema(branch);
      setFields(withStableKeys(res.data.fields || []).sort((a, b) => a.order - b.order));
    } catch {
      onMessage?.({ type: 'error', text: 'Error al cargar campos de la sucursal' });
      setFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const saveSchema = async () => {
    if (!selectedBranch) {
      onMessage?.({ type: 'error', text: 'Seleccioná una sucursal' });
      return;
    }
    const ids = new Set();
    for (const f of fields) {
      if (!f.id?.trim() || !f.label?.trim()) {
        onMessage?.({ type: 'error', text: 'Cada campo necesita id y label' });
        return;
      }
      if (ids.has(f.id)) {
        onMessage?.({ type: 'error', text: `Id duplicado: ${f.id}` });
        return;
      }
      ids.add(f.id);
      if (f.type === 'select' && (!f.options || f.options.length === 0)) {
        onMessage?.({ type: 'error', text: `El campo select "${f.label}" necesita opciones` });
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        fields: fields.map((f, i) => {
          const clean = stripClientKey(f);
          return {
            ...clean,
            id: slugifyId(clean.label),
            order: i + 1,
            systemKey: clean.systemKey || null,
            options: clean.type === 'select' ? clean.options : [],
          };
        }),
      };
      const res = await updateExtraDataSchema(selectedBranch, payload);
      setFields(withStableKeys(res.data.fields || []).sort((a, b) => a.order - b.order));
      onMessage?.({ type: 'success', text: `Campos guardados para ${selectedBranch.name}` });
    } catch (err) {
      onMessage?.({ type: 'error', text: err.response?.data?.error || 'Error al guardar campos' });
    } finally {
      setSaving(false);
    }
  };

  const loadTemplate = async () => {
    if (!selectedBranch) return;
    if (!window.confirm(`¿Cargar la plantilla del spreadsheet para "${selectedBranch.name}"? Esto reemplaza los campos actuales.`)) return;
    try {
      setSaving(true);
      const res = await resetExtraDataSchemaTemplate(selectedBranch);
      setFields(withStableKeys(res.data.fields || []).sort((a, b) => a.order - b.order));
      onMessage?.({ type: 'success', text: 'Plantilla cargada' });
    } catch {
      onMessage?.({ type: 'error', text: 'Error al cargar plantilla' });
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    setFields((prev) => [...prev, emptyField(prev.length + 1)]);
  };

  const removeField = (key) => {
    setFields((prev) => prev.filter((f) => f._key !== key));
  };

  const moveField = (key, dir) => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f._key === key);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateField = (key, patch) => {
    setFields((prev) => prev.map((f) => (f._key === key ? { ...f, ...patch } : f)));
  };

  const updateOption = (fieldKey, optIdx, patch) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f._key !== fieldKey) return f;
        const options = (f.options || []).map((o, i) => (i === optIdx ? { ...o, ...patch } : o));
        return { ...f, options };
      })
    );
  };

  const addOption = (fieldKey) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f._key !== fieldKey) return f;
        return { ...f, options: [...(f.options || []), { value: '', label: '', color: '' }] };
      })
    );
  };

  const removeOption = (fieldKey, optIdx) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f._key !== fieldKey) return f;
        return { ...f, options: (f.options || []).filter((_, i) => i !== optIdx) };
      })
    );
  };

  const syncIdFromLabel = (key) => {
    setFields((prev) =>
      prev.map((f) => (f._key === key ? { ...f, id: slugifyId(f.label) } : f))
    );
  };

  if (loading) {
    return <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando sucursales...</p>;
  }

  if (branches.length === 0) {
    return (
      <div className={`rounded-lg border p-6 text-center ${isDark ? 'bg-white/[0.03] border-line' : 'bg-gray-50 border-gray-200'}`}>
        <Building2 className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          No hay sucursales con transcripciones todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-4 ${isDark ? 'bg-white/[0.03] border-line' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex flex-wrap items-center gap-3">
          <Building2 className="w-4 h-4 text-[#F5A623]" />
          <label className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Sucursal</label>
          <select
            className={`${inputClass} max-w-sm`}
            value={selectedBranchKey}
            onChange={(e) => setSelectedBranchKey(e.target.value)}
          >
            {branches.map((b) => (
              <option key={branchKey(b)} value={branchKey(b)}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addField} className="text-sm px-4 py-2 rounded-md bg-[#F5A623] text-[#16120A] font-semibold hover:bg-[#FFBB54] transition-colors inline-flex items-center gap-1">
          <Plus className="w-4 h-4" /> Agregar campo
        </button>
        <button type="button" onClick={loadTemplate} className={`text-sm px-4 py-2 rounded-md border inline-flex items-center gap-1 transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
          <RotateCcw className="w-4 h-4" /> Cargar plantilla spreadsheet
        </button>
        <button type="button" onClick={saveSchema} disabled={saving} className="text-sm px-4 py-2 rounded-md bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1">
          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar campos'}
        </button>
      </div>

      {loadingFields ? (
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando campos...</p>
      ) : fields.length === 0 ? (
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          La sucursal &quot;{selectedBranch?.name}&quot; no tiene campos configurados todavía.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field._key} className={`rounded-lg border p-4 ${isDark ? 'bg-white/[0.02] border-line' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button type="button" onClick={() => moveField(field._key, -1)} disabled={idx === 0} className={`p-1 rounded disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveField(field._key, 1)} disabled={idx === fields.length - 1} className={`p-1 rounded disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Etiqueta</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={field.label}
                      onChange={(e) => updateField(field._key, { label: e.target.value })}
                      onBlur={() => syncIdFromLabel(field._key)}
                      placeholder="Ej: N° de orden"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Tipo</label>
                    <select
                      className={inputClass}
                      value={field.type}
                      onChange={(e) => updateField(field._key, { type: e.target.value })}
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field._key, { required: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#F5A623]"
                    />
                    Requerido
                  </label>
                  <button
                    type="button"
                    onClick={() => removeField(field._key)}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                    title="Eliminar campo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {field.type === 'select' && (
                <div className="mt-3 pl-8 space-y-2">
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Opciones</p>
                  {(field.options || []).map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="valor"
                        className={`${inputClass} max-w-[140px]`}
                        value={opt.value}
                        onChange={(e) => updateOption(field._key, optIdx, { value: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="etiqueta"
                        className={`${inputClass} max-w-[180px]`}
                        value={opt.label}
                        onChange={(e) => updateOption(field._key, optIdx, { label: e.target.value })}
                      />
                      <input
                        type="color"
                        className="w-9 h-9 rounded border-0 bg-transparent cursor-pointer"
                        value={opt.color || '#F5A623'}
                        onChange={(e) => updateOption(field._key, optIdx, { color: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(field._key, optIdx)}
                        className={`p-1 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(field._key)}
                    className={`text-xs px-3 py-1.5 rounded-md border inline-flex items-center gap-1 transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Plus className="w-3 h-3" /> Agregar opción
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
