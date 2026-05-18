// resources/js/Hooks/useSettingsForm.js
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useCalculatorSettings,
    useUpdateCalculatorSettings,
} from "./useProducts";
import { validateWaste } from "../constants/calculatorSettings";

export function useSettingsForm() {
    const {
        data: settings,
        isLoading,
        isError,
        error,
        refetch,
    } = useCalculatorSettings();

    const [waste, setWaste] = useState("10");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (settings) {
            setWaste(String(settings.waste ?? 10));
        }
    }, [settings]);

    const updateSettings = useUpdateCalculatorSettings();
    const isSaving = updateSettings.isPending;

    function handleWasteChange(e) {
        setWaste(e.target.value);
        if (errors.waste) setErrors((prev) => ({ ...prev, waste: undefined }));
    }

    async function handleSave() {
        const fieldErrors = validateWaste(waste);

        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            toast.error("Please fix the highlighted fields before saving.");
            return;
        }

        setErrors({});

        try {
            await updateSettings.mutateAsync({
                waste_percentage: parseFloat(waste),
            });
            toast.success("Settings saved successfully.");
        } catch (err) {
            const serverMsg =
                err?.response?.data?.message ||
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
        waste,
        errors,
        isSaving,
        handleWasteChange,
        handleSave,
    };
}
