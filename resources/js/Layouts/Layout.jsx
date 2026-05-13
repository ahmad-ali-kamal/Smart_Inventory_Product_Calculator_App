// Layouts/Layout.jsx
import Header from '../Components/UI/Header';
import AppToaster from '../Components/Common/Feedback/AppToaster';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Header />
            <AppToaster />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
}