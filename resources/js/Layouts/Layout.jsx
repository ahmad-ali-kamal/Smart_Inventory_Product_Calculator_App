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
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
}