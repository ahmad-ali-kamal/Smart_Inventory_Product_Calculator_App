import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import LanguageProvider from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext';
import { ProductsProvider } from './Context/ProductsContext';
import { HareesProvider } from './Context/HareesContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './Components/Common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

/*
 * ✅ FIX — WHITE FLASH: نضيف class "theme-ready" على body بعد أول render
 *
 * بدون هذا: المتصفح يطبّق transition من #FDFCFF (أبيض في :root)
 *           إلى #0F0E17 (داكن في ThemeProvider)
 *           وهذا بالضبط ما يسبب الوميض الأبيض عند أول زيارة!
 *
 * بعد هذا: الـ transition لا تعمل إلا بعد mount React الأول ← لا وميض
 */
function markThemeReady() {
    // requestAnimationFrame × 2 = بعد أول frame كامل — ضروري لمنع الوميض
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.add('theme-ready');
        });
    });
}

createInertiaApp({
    title: (title) => `${title}`,

    /*
     * ✅ PERSISTENT LAYOUT SUPPORT
     *
     * هذا الـ resolve يدعم نظام Page.layout الخاص بـ Inertia:
     * - عند أول تحميل: يُنشئ الـ layout ويُضيف الصفحة كـ children
     * - عند التنقل: يُعيد استخدام نفس instance الـ layout
     *   ← LiquidEther في GuestLayout تستمر دون إعادة mount ← لا وميض
     *
     * ملاحظة: resolvePageComponent لا تتعامل مع Page.layout تلقائياً
     * لكن createInertiaApp في Inertia v1+ يدعمها عبر الـ resolve prop مباشرة
     */
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),

    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <LanguageProvider>
                <QueryClientProvider client={queryClient}>
                    <ErrorBoundary>
                        <ThemeProvider>
                            <ProductsProvider>
                                <HareesProvider>
                                    <App {...props} />
                                </HareesProvider>
                                <Toaster position="top-center" />
                            </ProductsProvider>
                        </ThemeProvider>
                    </ErrorBoundary>
                </QueryClientProvider>
            </LanguageProvider>
        );

        // ✅ نفعّل الـ transition بعد الـ render الأول فقط — يمنع الوميض الأبيض
        markThemeReady();
    },

    progress: {
        color: '#E8BCCD',
    },
});