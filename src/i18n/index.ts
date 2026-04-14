import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en.json";
import es from "./es.json";
import ptBR from "./pt-BR.json";

const LANG_STORAGE_KEY = "dcode_lang";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      "pt-BR": { translation: ptBR },
      pt: { translation: ptBR },
    },
    supportedLngs: ["en", "es", "pt-BR", "pt"],
    nonExplicitSupportedLngs: true, // es-MX, es-CO, es-419 → es; pt-BR → pt-BR
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ["localStorage"],
      excludeCacheFor: ["cimode"],
    },
  });

export default i18n;
