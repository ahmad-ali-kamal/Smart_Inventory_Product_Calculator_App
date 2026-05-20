// resources/js/Hooks/useSettingsForm.js
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useCalculatorSettings,
    useUpdateCalculatorSettings,
} from "./useProducts";
import {
    validateWaste,
    validateCoverage,
} from "../constants/calculatorSettings";

export function useSettingsForm() {
    const {
        data: settings,
        isLoading,
        isError,
        error,
        refetch,
    } = useCalculatorSettings();

    const [coverage, setCoverage] = useState("");
    const [waste, setWaste] = useState("10");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!settings) return;
        setCoverage(settings.coverage != null ? String(settings.coverage) : "");
        setWaste(String(settings.waste ?? 10));
    }, [settings]);

    const updateSettings = useUpdateCalculatorSettings();
    const isSaving = updateSettings.isPending;

    function handleCoverageChange(e) {
        setCoverage(e.target.value);
        if (errors.coverage) setErrors((p) => ({ ...p, coverage: undefined }));
    }

    function handleWasteChange(e) {
        setWaste(e.target.value);
        if (errors.waste) setErrors((p) => ({ ...p, waste: undefined }));
    }

    async function handleSave() {
        const fieldErrors = {};

        const coverageErr = validateCoverage(coverage);
        if (coverageErr) fieldErrors.coverage = coverageErr;

        const wasteErrs = validateWaste(waste);
        Object.assign(fieldErrors, wasteErrs);

        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            toast.error("Please fix the highlighted fields before saving.");
            return;
        }

        setErrors({});

        try {
            await updateSettings.mutateAsync({
                coverage_per_unit: parseFloat(coverage),
                waste_percentage: parseFloat(waste),
            });
            toast.success("Settings saved successfully.");
        } catch (err) {
            const serverMsg =
                err?.response?.data?.message ||
                err?.response?.data?.errors?.coverage_per_unit?.[0] ||
                err?.response?.data?.errors?.waste_percentage?.[0] ||
                "Failed to save settings. Please try again.";
            toast.error(serverMsg);
        }
    }

    return {
        isLoading,
        isError,
        error,
        refetch,
        coverage,
        waste,
        errors,
        isSaving,
        handleCoverageChange,
        handleWasteChange,
        handleSave,
    };
}
