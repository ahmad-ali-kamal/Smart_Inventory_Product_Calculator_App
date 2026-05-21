/**
 * @file Settings.jsx
 * @module Pages/Mustashar
 *
 * Top-level page component for the Mustashar Calculator Settings screen.
 *
 * Responsibilities:
 *   - Guards the route via `useMustasharGuard` (redirects unauthenticated
 *     or unauthorised users before any UI renders).
 *   - Delegates all form state, validation, and server communication to the
 *     `useSettingsForm` hook.
 *   - Renders a full-page skeleton while server data is loading, then
 *     switches to the `SettingsForm` presentational component.
 *
 * This component is intentionally thin — it only wires the hook to the
 * view and handles the loading branch. All business logic lives in
 * `useSettingsForm`.
 *
 * Used by: Inertia router (direct page render)
 */

import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import { useSettingsForm } from '../../Hooks/useSettingsForm';
import { FormSkeleton } from '../../Components/Common/Skeleton/FormSkeleton';
import Layout from '../../Layouts/Layout';
import SettingsForm from '../../Components/Mustashar/Settings/SettingsForm';

// ── i18n strings ──────────────────────────────────────────────────────────────
// No visible strings are hardcoded in this component; the page title and all
// copy live in SettingsForm.jsx and useSettingsForm.js.
// This object is a placeholder for consistency — add page-level strings here
// (e.g. document title, breadcrumb) when needed.
const t = {};

/**
 * Settings
 *
 * Page-level component — no props; receives data via the Inertia page object
 * and the `useSettingsForm` hook.
 *
 * @returns {JSX.Element}
 */
export default function Settings() {
    // Redirect unauthorised users before rendering anything.
    useMustasharGuard();

    // Pull all form state and handlers from the dedicated form hook.
    const {
        isLoading, isError, error, refetch,
        coverage, waste,
        errors, isSaving,
        handleCoverageChange, handleWasteChange, handleSave,
    } = useSettingsForm();

    // ── Loading state ─────────────────────────────────────────────────────────
    // Show a skeleton form while the initial settings fetch is in-flight.
    // Wrapped in Layout so the nav chrome remains visible during loading.
    if (isLoading) {
        return (
            <Layout>
                <div className="p-8 max-w-4xl mx-auto">
                    <FormSkeleton />
                </div>
            </Layout>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    // PageShell handles the error boundary and retry UI when isError is true.
    return (
        <PageShell isError={isError} error={error} onRetry={refetch}>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                <SettingsForm
                    coverage={coverage}
                    waste={waste}
                    errors={errors}
                    isSaving={isSaving}
                    onCoverageChange={handleCoverageChange}
                    onWasteChange={handleWasteChange}
                    onSave={handleSave}
                />
            </div>
        </PageShell>
    );
}