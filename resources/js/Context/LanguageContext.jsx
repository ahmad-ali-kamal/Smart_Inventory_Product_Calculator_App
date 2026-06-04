import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n'; // ← أضف هذا

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('quantix_lang') || 'ar';
        }
        return 'ar';
    });

    useEffect(() => {
        localStorage.setItem('quantix_lang', lang);
        // ← أضف هذا: sync i18n مع الـ context
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
    }, [lang]);

    const toggle = () => setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const ff = isAr ? "'Cairo', sans-serif" : "'Changa', sans-serif";
    const bodyFont = isAr ? "'Cairo', sans-serif" : "'Changa', sans-serif";

    return (
        <LanguageContext.Provider value={{ lang, toggle, isAr, dir, ff, bodyFont }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    return useContext(LanguageContext);
}

export default LanguageProvider;