import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import LanguageProvider from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext';
import { ProductsProvider } from './Context/ProductsContext';
import { InventoryProvider } from './Context/InventoryContext';

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
        <LanguageProvider>
            <QueryClientProvider client={queryClient}>
                <ErrorBoundary>
                    <ThemeProvider>
                        <ProductsProvider>
                          <InventoryProvider>
                            <App {...props} />
                            </InventoryProvider>
                            <Toaster position="top-center" />
                        </ProductsProvider>
                    </ThemeProvider>
                </ErrorBoundary>
            </QueryClientProvider>
        </LanguageProvider>
    );
      
    },
    progress: {
        color: '#E8BCCD',
    },
});

