"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../lib/translations";
type Language = "en" | "es";
const english = new Map(Object.entries(translations).map(([en, es]) => [es, en]));
const LanguageContext = createContext({ language: "en" as Language, toggle: () => {}, t: (text: string) => text });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    const timeout = setTimeout(() => {
      try { const saved = localStorage.getItem("atelier-language"); if (saved === "es" || saved === "en") setLanguage(saved); } catch { /* Storage can be unavailable in private mode. */ }
    }, 0);
    return () => clearTimeout(timeout);
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const toggle = () => {
    const next = language === "en" ? "es" : "en";
    setLanguage(next);
    try { localStorage.setItem("atelier-language", next); } catch { /* The current session still switches. */ }
  };
  const t = (text: string) => language === "es" ? translations[text] || text : english.get(text) || text;
  return <LanguageContext.Provider value={{ language, toggle, t }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
export function LanguageToggle() {
  const { language, toggle } = useLanguage();
  return <button type="button" className="language-toggle" onClick={toggle} aria-label={language === "en" ? "Cambiar a español" : "Switch to English"}><span aria-hidden="true">◎</span> {language === "en" ? "ES" : "EN"}</button>;
}
