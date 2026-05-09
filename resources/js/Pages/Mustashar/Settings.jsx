// Pages/Mustashar/Settings.jsx
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import { useSettingsForm } from '../../Hooks/useSettingsForm';
import { FormSkeleton } from '../../Components/Common/Skeleton/FormSkeleton';
import Layout from '../../Layouts/Layout';
import SettingsForm from '../../Components/Mustashar/Settings/SettingsForm';
import LivePreviewCard from '../../Components/Mustashar/Settings/LivePreviewCard';
import { SlidersHorizontal } from 'lucide-react';

export default function Settings() {
    useMustasharGuard();

    const {
        isLoading, isError, error, refetch,
        coverage, waste, errors, isSaving, preview,
        handleCoverageChange, handleWasteChange, handleSave,
    } = useSettingsForm();

    // Settings has a custom loading skeleton, so we handle that case separately
    if (isLoading) {
        return <Layout><div className="p-8 max-w-4xl mx-auto"><FormSkeleton /></div></Layout>;
    }

    return (
        <PageShell isError={isError} error={error} onRetry={refetch}>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
                        <SlidersHorizontal size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-[var(--foreground)]">Calculator Settings</h1>
                        <p className="text-sm text-[var(--muted-foreground)] uppercase tracking-widest font-medium">
                            Configure calculation parameters for products
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SettingsForm
                        coverage={coverage}
                        waste={waste}
                        errors={errors}
                        isSaving={isSaving}
                        onCoverageChange={handleCoverageChange}
                        onWasteChange={handleWasteChange}
                        onSave={handleSave}
                    />
                    <LivePreviewCard preview={preview} />
                </div>
            </div>
        </PageShell>
    );
}