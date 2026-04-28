import React, { createContext, useContext, useEffect, useState } from 'react';

// Global language context
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('quantix_lang') || 'ar';
        }
        return 'ar';
    });

    // Persist language selection
    useEffect(() => {
        localStorage.setItem('quantix_lang', lang);
    }, [lang]);

    const toggle = () => setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const ff = isAr ? "'Almarai', sans-serif" : "'Cormorant Garamond', serif";

    return (
        <LanguageContext.Provider value={{ lang, toggle, isAr, dir, ff }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    return useContext(LanguageContext);
}

export default LanguageProvider;
