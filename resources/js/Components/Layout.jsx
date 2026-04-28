// resources/js/Components/Layout.jsx
import { Link, usePage } from '@inertiajs/react';
import Header from './Header';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Header />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
}