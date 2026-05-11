// hooks/useSettingsForm.js
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useCalculatorSettings,
    useUpdateCalculatorSettings,
} from "./useProducts";
import {
    COVERAGE_MIN, COVERAGE_MAX,
    WASTE_MIN, WASTE_MAX,
    validateFields,
} from "../constants/calculatorSettings";

export function useSettingsForm() {
    // ── Server state (React Query) ──────────────────────────────────────────
    const {
        data: settings,
        isLoading,
        isError,
        error,
        refetch,
    } = useCalculatorSettings();

    // ── Local form state ────────────────────────────────────────────────────
    const [coverage, setCoverage] = useState("8");
    const [waste, setWaste] = useState("10");
    const [errors, setErrors] = useState({});

    // Hydrate form once server data arrives (or changes)
    useEffect(() => {
        if (settings) {
            setCoverage(String(settings.coverage ?? 8));
            setWaste(String(settings.waste ?? 10));
        }
    }, [settings]);

    // ── Mutation ────────────────────────────────────────────────────────────
    const updateSettings = useUpdateCalculatorSettings();
    const isSaving = updateSettings.isPending;

    // ── Handlers ────────────────────────────────────────────────────────────
    function handleCoverageChange(e) {
        setCoverage(e.target.value);
        if (errors.coverage)
            setErrors((prev) => ({ ...prev, coverage: undefined }));
    }

    function handleWasteChange(e) {
        setWaste(e.target.value);
        if (errors.waste) setErrors((prev) => ({ ...prev, waste: undefined }));
    }

    async function handleSave() {
        const fieldErrors = validateFields(coverage, waste);

        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            toast.error("Please fix the highlighted fields before saving.");
            return;
        }

        setErrors({});

        try {
            await updateSettings.mutateAsync({
                coverage: parseFloat(coverage),
                waste: parseFloat(waste),
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
        // Query state
        isLoading,
        isError,
        error,
        refetch,
        // Form state
        coverage,
        waste,
        errors,
        isSaving,
        // Handlers
        handleCoverageChange,
        handleWasteChange,
        handleSave,
    };
}