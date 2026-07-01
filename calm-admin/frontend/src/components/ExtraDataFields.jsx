const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moneda' },
  { value: 'date', label: 'Fecha' },
  { value: 'time', label: 'Hora' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Selección' },
];

export { FIELD_TYPES };

export function branchKey(branch) {
  const id = branch?.id ?? branch?.branchId ?? '';
  const name = branch?.name ?? branch?.branchName ?? '';
  return `${id}::${name}`;
}

export function branchSchemaParams(branch) {
  const branchId = branch?.id ?? branch?.branchId ?? null;
  const branchName = branch?.name ?? branch?.branchName;
  const params = { branchName };
  if (branchId != null && !Number.isNaN(branchId)) params.branchId = branchId;
  return params;
}

export function findBranchForTranscription(transcription, branches) {
  if (!transcription) return null;
  const byId = branches.find((b) => {
    const id = b.id ?? b.branchId;
    return id != null && String(id) === String(transcription.branchId);
  });
  if (byId) return byId;
  if (transcription.branchName) {
    return branches.find(
      (b) => (b.name ?? b.branchName)?.toLowerCase() === transcription.branchName?.toLowerCase()
    ) ?? { branchId: transcription.branchId, branchName: transcription.branchName, name: transcription.branchName };
  }
  return null;
}

export function slugifyId(label) {
  return (label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || 'campo';
}

export function getFieldValue(transcription, field) {
  const extra = transcription?.extraData || {};
  if (extra[field.id] !== undefined && extra[field.id] !== null && extra[field.id] !== '') {
    return extra[field.id];
  }
  if (field.systemKey) {
    return transcription?.[field.systemKey];
  }
  return '';
}

export function getSelectOption(field, value) {
  if (!field?.options) return null;
  return field.options.find((o) => o.value === value) || null;
}

export function formatDisplayValue(field, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (field.type === 'checkbox') {
    return value === true || value === 'true' || value === 'si' || value === 'sí' || value === '1' ? 'Sí' : 'No';
  }
  if (field.type === 'select') {
    const opt = getSelectOption(field, String(value));
    return opt?.label || String(value);
  }
  if (field.type === 'currency') {
    const n = Number(String(value).replace(',', '.'));
    if (!Number.isNaN(n)) {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
    }
  }
  return String(value);
}

export function useExtraDataInputClass(isDark) {
  return `w-full px-3 py-2 rounded-md border text-sm ${
    isDark
      ? 'bg-ink-overlay border-line-strong text-white placeholder-slate-500 focus:border-[#F5A623]/60'
      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#F5A623]'
  } focus:outline-none focus:ring-1 focus:ring-[#F5A623]/30`;
}

export function ExtraDataFieldInput({ field, value, onChange, inputClass }) {
  const id = `extra-${field.id}`;

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          id={id}
          className={`${inputClass} resize-none`}
          rows={3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 accent-[#F5A623]"
          />
          <label htmlFor={id} className="text-sm">{field.label}</label>
        </div>
      );
    case 'select': {
      const selected = getSelectOption(field, String(value ?? ''));
      const bg = selected?.color || undefined;
      return (
        <select
          id={id}
          className={inputClass}
          style={bg ? { backgroundColor: bg, color: '#16120A' } : undefined}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Sin especificar —</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value} style={opt.color ? { backgroundColor: opt.color } : undefined}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
    case 'number':
    case 'currency':
      return (
        <input
          id={id}
          type="number"
          step={field.type === 'currency' ? '0.01' : '1'}
          className={inputClass}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'date':
      return <input id={id} type="date" className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'time':
      return <input id={id} type="time" className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'email':
      return <input id={id} type="email" className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input id={id} type="text" className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function ExtraDataReadOnly({ fields, transcription, isDark, onEdit }) {
  const sorted = [...(fields || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!sorted.length) return null;

  return (
    <div className={`rounded-lg border p-5 lg:col-span-2 ${isDark ? 'bg-ink-raised border-line' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-display font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Datos extra</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${isDark ? 'border-line-strong text-slate-300 hover:text-[#F5A623] hover:border-[#F5A623]/40' : 'border-gray-300 text-gray-600 hover:text-[#F5A623] hover:border-[#F5A623]/40'}`}
          >
            Editar
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sorted.map((field) => {
          const raw = getFieldValue(transcription, field);
          const display = formatDisplayValue(field, raw);
          const opt = field.type === 'select' ? getSelectOption(field, String(raw ?? '')) : null;

          return (
            <div key={field.id}>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{field.label}</p>
              {field.type === 'select' && opt?.color ? (
                <span
                  className="inline-flex px-2.5 py-1 rounded-md text-[13px] font-medium text-[#16120A]"
                  style={{ backgroundColor: opt.color }}
                >
                  {display}
                </span>
              ) : (
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{display}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
