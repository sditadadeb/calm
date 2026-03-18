import { createContext, useContext, useState, useCallback } from 'react';
import es from '../i18n/es';
import en from '../i18n/en';

const translations = { es, en };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es');

  const switchLang = useCallback((l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback((key, vars) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    if (val == null) {
      let fallback = translations.es;
      for (const k of keys) fallback = fallback?.[k];
      val = fallback ?? key;
    }
    if (vars && typeof val === 'string') {
      Object.entries(vars).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, v);
      });
    }
    return val;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
