// resources/js/Pages/Mustashar/Settings.jsx
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import { useSettingsForm } from '../../Hooks/useSettingsForm';
import { FormSkeleton } from '../../Components/Common/Skeleton/FormSkeleton';
import Layout from '../../Layouts/Layout';
import SettingsForm from '../../Components/Mustashar/Settings/SettingsForm';

export default function Settings() {
    useMustasharGuard();

    const {
        isLoading, isError, error, refetch,
        waste,
        errors, isSaving,
        handleWasteChange, handleSave,
    } = useSettingsForm();

    if (isLoading) {
        return <Layout><div className="p-8 max-w-4xl mx-auto"><FormSkeleton /></div></Layout>;
    }

    return (
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