/**
 * @file GuestLayout.jsx
 * @project Quantix — Intelligent Salla Store Management Platform
 *
 * Root layout wrapper applied to all unauthenticated (guest) pages,
 * including the public landing page. Provides a clean white full-viewport
 * container so every guest-facing view starts from a consistent baseline.
 *
 * Usage (via Inertia persistent layout):
 *   Welcome.layout = page => <GuestLayout>{page}</GuestLayout>;
 */

/**
 * GuestLayout
 *
 * Wraps guest (unauthenticated) pages with a minimal full-viewport container.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The page content to render inside the layout.
 * @returns {JSX.Element}
 */
export default function GuestLayout({ children }) {
    return (
        /* Full-viewport white background; individual sections control their own colours */
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            {children}
        </div>
    );
}