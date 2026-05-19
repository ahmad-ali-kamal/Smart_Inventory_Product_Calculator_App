/**
 * @file Settings.jsx
 * @module Pages/Mustashar
 *
 * @description
 * Top-level page component for the Mustashar Calculator Settings screen.
 * Responsibilities:
 *  - Guards the route via `useMustasharGuard` (redirects unauthenticated users).
 *  - Delegates all form state and server-sync logic to `useSettingsForm`.
 *  - Renders a full-page loading skeleton while server data is in-flight.
 *  - Wraps the form in `PageShell` to handle error-boundary / retry UI.
 *
 * Data flow:
 *   useSettingsForm (React Query + local state)
 *     → SettingsForm (pure presentational card)
 *       → SettingsField (single labelled input)
 */

import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import { useSettingsForm } from '../../Hooks/useSettingsForm';
import { FormSkeleton } from '../../Components/Common/Skeleton/FormSkeleton';
import Layout from '../../Layouts/Layout';
import SettingsForm from '../../Components/Mustashar/Settings/SettingsForm';

// ---------------------------------------------------------------------------
// i18n strings — move these values to your JSON translation file when ready.
// ---------------------------------------------------------------------------
// (No user-visible strings are rendered directly in this page shell;
//  all copy lives inside SettingsForm / SettingsField.)

/**
 * Settings page for the Mustashar sub-app.
 *
 * Renders the calculator settings form, gated behind the Mustashar guard.
 * Shows a skeleton loader while the initial settings fetch is pending.
 *
 * @returns {JSX.Element}
 */
export default function Settings() {
    // Redirect to the appropriate landing page if the user lacks Mustashar access.
    useMustasharGuard();

    // Destructure everything the form needs from the unified settings hook.
    const {
        isLoading, isError, error, refetch,
        waste,
        errors, isSaving,
        handleWasteChange, handleSave,
    } = useSettingsForm();

    // Show a skeleton card while the first settings fetch is in-flight.
    if (isLoading) {
        return (
            <Layout>
                <div className="p-8 max-w-4xl mx-auto">
                    <FormSkeleton />
                </div>
            </Layout>
        );
    }

    return (
        // PageShell renders an error state with a retry button when isError is true.
        <PageShell isError={isError} error={error} onRetry={refetch}>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                <SettingsForm
                    waste={waste}
                    errors={errors}
                    isSaving={isSaving}
                    onWasteChange={handleWasteChange}
                    onSave={handleSave}
                />
            </div>
        </PageShell>
    );
}