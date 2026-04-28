import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './Components/Common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
            <App {...props} />
            <Toaster position="top-center" />
        </ErrorBoundary>
    </QueryClientProvider>
);
    },
    progress: {
        color: '#E8BCCD',
    },
    
});