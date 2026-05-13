// resources/js/Hooks/useSettingsForm.js
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useCalculatorSettings,
    useUpdateCalculatorSettings,
} from "./useProducts";
import { WASTE_MIN, WASTE_MAX, validateFields } from "../constants/calculatorSettings";

export function useSettingsForm() {
    const {
        data: settings,
        isLoading,
        isError,
        error,
        refetch,
    } = useCalculatorSettings();

    const [waste, setWaste] = useState("10");
    const [unitType, setUnitType] = useState("m2");
    const [minInputArea, setMinInputArea] = useState("");
    const [maxInputArea, setMaxInputArea] = useState("");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (settings) {
            setWaste(String(settings.waste ?? 10));
            setUnitType(settings.unit_type || "m2");
            setMinInputArea(settings.min_input_area !== null ? String(settings.min_input_area) : "");
            setMaxInputArea(settings.max_input_area !== null ? String(settings.max_input_area) : "");
        }
    }, [settings]);

    const updateSettings = useUpdateCalculatorSettings();
    const isSaving = updateSettings.isPending;

    function handleWasteChange(e) {
        setWaste(e.target.value);
        if (errors.waste) setErrors((prev) => ({ ...prev, waste: undefined }));
    }

    function handleUnitTypeChange(e) {
        setUnitType(e.target.value);
        if (errors.unit_type) setErrors((prev) => ({ ...prev, unit_type: undefined }));
    }

    function handleMinAreaChange(e) {
        setMinInputArea(e.target.value);
        if (errors.min_input_area) setErrors((prev) => ({ ...prev, min_input_area: undefined }));
    }

    function handleMaxAreaChange(e) {
        setMaxInputArea(e.target.value);
        if (errors.max_input_area) setErrors((prev) => ({ ...prev, max_input_area: undefined }));
    }

    async function handleSave() {
        const fieldErrors = validateFields(waste, unitType, minInputArea, maxInputArea);

        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            toast.error("Please fix the highlighted fields before saving.");
            return;
        }

        setErrors({});

        try {
            await updateSettings.mutateAsync({
                waste_percentage: parseFloat(waste),
                unit_type: unitType,
                min_input_area: minInputArea ? parseFloat(minInputArea) : null,
                max_input_area: maxInputArea ? parseFloat(maxInputArea) : null,
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
        unitType,
        minInputArea,
        maxInputArea,
        errors,
        isSaving,
        handleWasteChange,
        handleUnitTypeChange,
        handleMinAreaChange,
        handleMaxAreaChange,
        handleSave,
    };
}