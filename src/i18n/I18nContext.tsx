import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";

export type Language = "en" | "ar";

type Dict = Record<string, unknown>;

export type I18nContextValue = {
  language: Language;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getStoredLanguage(): Language {
  const raw = localStorage.getItem("language");
  return raw === "ar" ? "ar" : "en";
}

function getByPath(dict: Dict, key: string): unknown {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Dict)[p];
  }
  return cur;
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name)
      ? String(vars[name])
      : `{{${name}}}`,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    getStoredLanguage(),
  );

  const value = useMemo<I18nContextValue>(() => {
    const dict: Dict = language === "ar" ? (ar as Dict) : (en as Dict);
    const dir = language === "ar" ? "rtl" : "ltr";
    const isRTL = dir === "rtl";

    const setLanguage = (lang: Language) => {
      localStorage.setItem("language", lang);
      setLanguageState(lang);
    };

    const t = (key: string, vars?: Record<string, string | number>) => {
      const v = getByPath(dict, key);
      if (typeof v === "string") return interpolate(v, vars);
      return key;
    };

    return { language, dir, isRTL, setLanguage, t };
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = value.language;
    document.documentElement.dir = value.dir;
  }, [value.language, value.dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
