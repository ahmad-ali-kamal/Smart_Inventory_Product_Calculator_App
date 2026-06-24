/**
 * @file Settings.jsx
 * @module Pages/Harees
 *
 * @description
 * Top-level page component for the Harees Inventory Settings screen.
 *
 * Responsibilities:
 *  - Guards the route via `useHareesGuard` (redirects unauthorised visitors).
 *  - Delegates all form state, validation, and server-sync to `useInventorySettingsForm`.
 *  - Renders two stacked `FormSkeleton` cards while the initial fetch is in-flight.
 *  - Wraps the form cards in `PageShell` to handle the error-boundary / retry UI.
 *
 * Card layout (top → bottom):
 *   ThresholdCard       — numeric expiry thresholds (short / medium / long)
 *   CategoryMappingCard — drag-and-drop category → bucket assignment
 *   AutomationCard      — auto-hide and auto-discount toggles + discount config + save button
 *
 * Data flow:
 *   useInventorySettingsForm (React Query + local state)
 *     → ThresholdCard, CategoryMappingCard, AutomationCard
 */

import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import Layout from '../../Layouts/Layout';
import { useInventorySettingsForm } from '../../Hooks/useInventorySettingsForm';
import { FormSkeleton } from '../../Components/Common/Skeleton/FormSkeleton';
import ThresholdCard from '../../Components/Harees/Settings/ThresholdCard';
import CategoryMappingCard from '../../Components/Harees/Settings/CategoryMappingCard';
import AutomationCard from '../../Components/Harees/Settings/AutomationCard';

// ---------------------------------------------------------------------------
// i18n strings — move these values to a JSON translation file when ready.
// ---------------------------------------------------------------------------
// (No user-visible strings are rendered directly in this shell; all copy
//  lives inside the card sub-components.)

/**
 * Settings page for the Harees sub-app.
 *
 * Renders the inventory settings form, gated behind the Harees guard.
 * Shows two skeleton cards while the initial settings fetch is pending.
 *
 * @returns {JSX.Element}
 */
export default function Settings() {
    // Redirect unauthenticated or unauthorised visitors.
    useHareesGuard();

    const {
        isLoading, isError, error, refetch,
        // Form data slices — each passed to the relevant card
        thresholds, automation, discountConfig,
        categories, unassigned, yellowLabel,
        // Validation + save state
        errors, saving, saved, saveError, hasActiveErrors,
        // Event handlers
        handleInputChange, handleToggle, handleYellowLabelChange,
        handleDragStart, handleDrop, handleSave,
    } = useInventorySettingsForm();

    // Show two skeleton cards while the settings query is in-flight.
    // Two cards reflect the approximate visual weight of the full form.
    if (isLoading) {
        return (
            <Layout>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 py-10">
                    <FormSkeleton />
                    <FormSkeleton />
                </div>
            </Layout>
        );
    }

    return (
        // PageShell renders an error state with a retry button when isError is true.
        <PageShell isError={isError} error={error} context="settings" onRetry={refetch}>
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 pb-10">

                {/* Expiry threshold inputs — short / medium / long day counts */}
                <ThresholdCard
                    thresholds={thresholds}
                    errors={errors}
                    onInputChange={handleInputChange}
                />

                {/* Drag-and-drop category → expiry bucket assignment */}
                <CategoryMappingCard
                    unassigned={unassigned}
                    categories={categories}
                    thresholds={thresholds}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                />

                {/* Automation toggles, discount config, and yellow batch label */}
                <AutomationCard
                    automation={automation}
                    discountConfig={discountConfig}
                    yellowLabel={yellowLabel}
                    errors={errors}
                    onToggle={handleToggle}
                    onInputChange={handleInputChange}
                    onYellowLabelChange={handleYellowLabelChange}
                    onSave={handleSave}
                    saving={saving}
                    saved={saved}
                    saveDisabled={hasActiveErrors}
                    saveError={saveError}
                />

            </div>
        </PageShell>
    );
}