// Layouts/Layout.jsx
import { useEffect } from 'react';
import { useLang } from '../Context/LanguageContext';
import Header from '../Components/UI/Header';
import AppToaster from '../Components/Common/Feedback/AppToaster';

export default function Layout({ children }) {
    const { isAr, dir, ff } = useLang();

    useEffect(() => {
        document.documentElement.dir  = dir;
        document.documentElement.lang = isAr ? 'ar' : 'en';
        document.documentElement.style.setProperty('--font-sans', ff);
        document.body.style.fontFamily = ff;
    }, [dir, ff, isAr]);

    return (
        <div
            dir={dir}
            style={{ fontFamily: ff }}
            className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
        >
            <Header />
            <AppToaster />
            <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10"
                  style={{ maxWidth: 'min(90vw, 80rem)' }}
                  role="main"
                  aria-label={isAr ? 'المحتوى الرئيسي' : 'Main content'}
            >
                {children}
            </main>
        </div>
    );
}