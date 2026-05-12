// Pages/Harees/Settings.jsx
import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import Layout from '../../Layouts/Layout';
import { useInventorySettingsForm } from '../../Hooks/useInventorySettingsForm';
import { FormSkeleton } from '../../Components/Common/Skeleton/FormSkeleton';
import ThresholdCard from '../../Components/Harees/Settings/ThresholdCard';
import CategoryMappingCard from '../../Components/Harees/Settings/CategoryMappingCard';
import AutomationCard from '../../Components/Harees/Settings/AutomationCard';
import SaveButton from '../../Components/Harees/Settings/SaveButton';

export default function Settings() {
    useHareesGuard();

    const {
        isLoading, isError, error, refetch,
        thresholds, automation, discountConfig,
        categories, unassigned,
        errors, saving, saved, saveError, hasActiveErrors,
        handleInputChange, handleToggle,
        handleDragStart, handleDrop, handleSave,
    } = useInventorySettingsForm();

    // Custom skeleton — same reason as Mustashar Settings
    if (isLoading) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto space-y-5 py-10">
                    <FormSkeleton />
                    <FormSkeleton />
                </div>
            </Layout>
        );
    }

    return (
        <PageShell isError={isError} error={error} onRetry={refetch}>
            <div className="max-w-2xl mx-auto space-y-5 pb-10">
                <ThresholdCard thresholds={thresholds} errors={errors} onInputChange={handleInputChange} />
                <CategoryMappingCard unassigned={unassigned} categories={categories} thresholds={thresholds} onDragStart={handleDragStart} onDrop={handleDrop} />
                <AutomationCard automation={automation} discountConfig={discountConfig} errors={errors} onToggle={handleToggle} onInputChange={handleInputChange} />
                <SaveButton onSave={handleSave} saving={saving} saved={saved} disabled={hasActiveErrors} saveError={saveError} />
            </div>
        </PageShell>
    );
}