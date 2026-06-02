import './i18n'; 
import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import LanguageProvider from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './Components/Common/ErrorBoundary';


const queryClient = new QueryClient();


function markThemeReady() {
   
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.add('theme-ready');
        });
    });
}

createInertiaApp({
    title: (title) => `${title}`,

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
                                    <App {...props} />
                              
                        </ThemeProvider>
                    </ErrorBoundary>
                </QueryClientProvider>
            </LanguageProvider>
        );

        markThemeReady();
    },

    progress: {
        color: '#E8BCCD',
    },
});