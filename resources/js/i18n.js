import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation JSON files directly
import en from "./translations/mustashar/en.json";
import ar from "./translations/mustashar/ar.json";
import sharedEn from "./translations/shared/en.json";
import sharedAr from "./translations/shared/ar.json";
import hareesEn from "./translations/harees/en.json";
import hareesAr from "./translations/harees/ar.json";
import welcomeEn from "./translations/welcome/en.json";
import welcomeAr from "./translations/welcome/ar.json";
import mustasharLoginEn from "./translations/mustashar-login/en.json";
import mustasharLoginAr from "./translations/mustashar-login/ar.json";
import hareesLoginEn from "./translations/harees-login/en.json";
import hareesLoginAr from "./translations/harees-login/ar.json";

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                mustashar: en,
                shared: sharedEn,
                harees: hareesEn,
                welcome: welcomeEn,
                "mustashar-login": mustasharLoginEn,
                "harees-login": hareesLoginEn,
            },
            ar: {
                mustashar: ar,
                shared: sharedAr,
                harees: hareesAr,
                welcome: welcomeAr,
                "mustashar-login": mustasharLoginAr,
                "harees-login": hareesLoginAr,
            },
        },
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
