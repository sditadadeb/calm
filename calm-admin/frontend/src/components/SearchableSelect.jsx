import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function SearchableSelect({
  options,
  value,
  onChange,
  allLabel,
  isDark,
  inputClassName,
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  const sorted = useMemo(
    () =>
      [...options].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
      ),
    [options]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((o) => (o.name || '').toLowerCase().includes(q));
  }, [sorted, query]);

  const selected = options.find((o) => String(o.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const listClasses = isDark
    ? 'bg-ink-overlay border-line-strong text-white shadow-black/40'
    : 'bg-white border-gray-200 text-gray-800';

  const itemHover = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100';
  const itemActive = isDark ? 'bg-[#F5A623]/15 text-[#F5A623]' : 'bg-amber-50 text-[#D4911F]';

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={open ? query : (selected?.name ?? '')}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={allLabel}
          className={`${inputClassName} pr-9`}
          autoComplete="off"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
            isDark ? 'text-slate-400' : 'text-gray-400'
          }`}
        />
      </div>

      {open && (
        <ul
          className={`absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border shadow-lg ${listClasses}`}
          role="listbox"
        >
          <li
            role="option"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange(null);
              setOpen(false);
              setQuery('');
            }}
            className={`px-3 py-2 text-sm cursor-pointer ${itemHover} ${
              !value ? itemActive : ''
            }`}
          >
            {allLabel}
          </li>
          {filtered.map((opt) => (
            <li
              key={opt.id}
              role="option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(String(opt.id));
                setOpen(false);
                setQuery('');
              }}
              className={`px-3 py-2 text-sm cursor-pointer ${itemHover} ${
                String(opt.id) === String(value) ? itemActive : ''
              }`}
            >
              {opt.name}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className={`px-3 py-2 text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {t('filters.noResults')}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
