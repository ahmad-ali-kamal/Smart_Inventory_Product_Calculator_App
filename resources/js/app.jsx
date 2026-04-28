import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from './Context/ThemeContext';
import { ProductsProvider } from './Context/ProductsContext';

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
        <ThemeProvider>
            <ProductsProvider>
                <App {...props} />
            </ProductsProvider>
        </ThemeProvider>);
    },
    progress: {
        color: '#E8BCCD',
    },
});

