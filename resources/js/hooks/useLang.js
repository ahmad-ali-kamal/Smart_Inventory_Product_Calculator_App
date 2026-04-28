import { useState, useEffect } from 'react';

/**
 * useLang — shared language hook
 * يحفظ اختيار اللغة في localStorage ليبقى عند التنقل بين الصفحات
 */
export function useLang() {
    const [lang, setLangState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('quantix_lang') || 'ar';
        }
        return 'ar';
    });

    const toggle = () => {
        const next = lang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('quantix_lang', next);
        setLangState(next);
    };

    const isAr = lang === 'ar';

    return {
        lang,
        toggle,
        isAr,
        dir: isAr ? 'rtl' : 'ltr',
        ff:  isAr ? "'Almarai', sans-serif" : "'Cormorant Garamond', serif",
    };
}