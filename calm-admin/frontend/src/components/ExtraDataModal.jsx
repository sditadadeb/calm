import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getExtraDataSchema, getBranches, updateExtraData } from '../api';
import {
  ExtraDataFieldInput,
  getFieldValue,
  useExtraDataInputClass,
  findBranchForTranscription,
} from './ExtraDataFields';

export default function ExtraDataModal({ transcription, onSaved, onClose }) {
  const { isDark } = useTheme();
  const [schemaFields, setSchemaFields] = useState([]);
  const [form, setForm] = useState({});
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [branchLabel, setBranchLabel] = useState('');

  const inputClass = useExtraDataInputClass(isDark);

  useEffect(() => {
    const load = async () => {
      try {
        const branchesRes = await getBranches();
        const branches = (branchesRes.data || []).map((b) => ({
          id: b.id,
          name: b.name ?? b.branchName,
        }));
        const branch = findBranchForTranscription(transcription, branches);
        setBranchLabel(branch?.name || transcription.branchName || 'Sin sucursal');

        if (!branch?.name) {
          setSchemaFields([]);
          setError('No se pudo identificar la sucursal de esta grabación.');
          return;
        }

        const res = await getExtraDataSchema(branch);
        const fields = (res.data.fields || []).sort((a, b) => a.order - b.order);
        setSchemaFields(fields);
        const initial = {};
        fields.forEach((field) => {
          initial[field.id] = getFieldValue(transcription, field);
          if (field.type === 'checkbox') {
            initial[field.id] = !!initial[field.id];
          }
        });
        setForm(initial);
        setError(fields.length === 0
          ? `La sucursal "${branch.name}" no tiene campos configurados. Configuralos en Configuración → Datos extra.`
          : null);
      } catch {
        setError('No se pudo cargar el schema de datos extra');
      } finally {
        setLoadingSchema(false);
      }
    };
    load();
  }, [transcription]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (schemaFields.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      for (const field of schemaFields) {
        if (field.required && (form[field.id] === '' || form[field.id] === null || form[field.id] === undefined)) {
          setError(`El campo "${field.label}" es requerido`);
          setSaving(false);
          return;
        }
      }
      const res = await updateExtraData(transcription.recordingId, { values: form });
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al guardar los datos');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-xl border ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
          <div>
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Editar datos extra</h2>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Sucursal: {branchLabel}</p>
          </div>
          <button onClick={onClose} className={isDark ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-gray-800'}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {loadingSchema ? (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando campos...</div>
        ) : schemaFields.length === 0 ? (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {error || 'No hay campos configurados para esta sucursal.'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {schemaFields.map((field) => (
              <div key={field.id}>
                {field.type !== 'checkbox' && (
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{field.label}</label>
                )}
                <ExtraDataFieldInput
                  field={field}
                  value={form[field.id]}
                  onChange={(val) => setForm({ ...form, [field.id]: val })}
                  inputClass={inputClass}
                />
              </div>
            ))}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-inherit">
              <button
                type="button"
                onClick={onClose}
                className={`text-sm px-4 py-2 rounded-md transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="text-sm px-4 py-2 rounded-md bg-[#F5A623] text-[#16120A] font-semibold hover:bg-[#FFBB54] transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
