import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// استيراد ملفات الترجمة مباشرة
import en from "./translations/mustashar/en.json";
import ar from "./translations/mustashar/ar.json";
import sharedEn from "./translations/shared/en.json";
import sharedAr from "./translations/shared/ar.json";
import hareesEn from "./translations/harees/en.json";
import hareesAr from "./translations/harees/ar.json";
i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { mustashar: en, shared: sharedEn, harees: hareesEn },
            ar: { mustashar: ar, shared: sharedAr, harees: hareesAr },
        },
        lng: "en", // اللغة الافتراضية
        fallbackLng: "en",
        interpolation: {
            escapeValue: false, // React تتولى الـ escaping
        },
    });

export default i18n;
