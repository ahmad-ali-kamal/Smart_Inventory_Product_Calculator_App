// resources/js/Hooks/useSettingsForm.js
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useCalculatorSettings,
    useUpdateCalculatorSettings,
} from "./useProducts";
import { validateWaste } from "../constants/calculatorSettings";

/**
 * Manages form state, validation, and server synchronisation for the
 * Mustashar Calculator Settings page.
 *
 * @returns {{
 *   isLoading: boolean,
 *   isError:   boolean,
 *   error:     Error|null,
 *   refetch:   function,
 *   coverage:  string,
 *   waste:     string,
 *   errors:    { coverage?: string, waste?: string },
 *   isSaving:  boolean,
 *   handleCoverageChange: function,
 *   handleWasteChange:    function,
 *   handleSave:           function,
 * }}
 */
export function useSettingsForm() {
    const {
        data: settings,
        isLoading,
        isError,
        error,
        refetch,
    } = useCalculatorSettings();

    const [waste, setWaste] = useState("10");

    /** Per-field validation error messages keyed by field name. */
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (settings) {
            setWaste(String(settings.waste ?? 10));
        }
    }, [settings]);

    const updateSettings = useUpdateCalculatorSettings();

    /** True while the POST request is in-flight — used to disable the save button. */
    const isSaving = updateSettings.isPending;

    function handleWasteChange(e) {
        setWaste(e.target.value);
        if (errors.waste) setErrors((prev) => ({ ...prev, waste: undefined }));
    }

    /**
     * Validates both fields, then POSTs the settings to the server.
     *
     * Flow:
     *  1. Run client-side validation via `validateFields`.
     *  2. If errors exist → set error state + show toast, bail out.
     *  3. Otherwise clear errors and call `updateSettings.mutateAsync`.
     *  4. On success → success toast.
     *  5. On failure → extract the most specific server error message and show it.
     *
     * @returns {Promise<void>}
     */
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
            // Prefer the most granular Laravel validation message available,
            // falling back to a generic copy if the server returns nothing useful.
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
