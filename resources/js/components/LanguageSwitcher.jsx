import React from 'react';

export default function LanguageSwitcher({ currentLocale }) {
    const toggleLanguage = () => {
        const newLocale = currentLocale === 'ar' ? 'en' : 'ar';
        // هنا مستقبلاً سنرسل طلب لتغيير اللغة في الجلسة (Session)
        window.location.href = `/language/${newLocale}`; 
    };

    return (
        <button 
            onClick={toggleLanguage}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition text-sm font-medium"
        >
            {currentLocale === 'ar' ? 'English' : 'العربية'}
        </button>
    );
}