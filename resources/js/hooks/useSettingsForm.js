/**
 * @file useSettingsForm.js
 * @module Hooks
 *
 * Encapsulates all state and behaviour for the Mustashar Settings
 * form. Separating form logic from the UI component keeps `SettingsForm.jsx`
 * a pure, props-driven view with no data-fetching concerns.
 *
 * Responsibilities:
 *   - Loads current settings via `useMustasharSettings` and seeds local
 *     controlled-input state whenever the server data arrives or changes.
 *   - Validates both fields before submission using the shared validators
 *     from `mustasharSettings.js`.
 *   - Delegates the actual save to `useUpdateMustasharSettings` and
 *     surfaces success / error feedback via `react-hot-toast`.
 *
 * Used by: Mustashar Settings (page component)
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useMustasharSettings,
    useUpdateMustasharSettings,
} from "./useProducts";
import {
    validateWaste,
    validateCoverage,
} from "../constants/mustasharSettings";

/**
 * useSettingsForm
 *
 * Provides form state, change handlers, and a save handler for the
 * global mustashar settings screen.
 *
 * @returns {{
 *   isLoading:            boolean,
 *   isError:              boolean,
 *   error:                Error|null,
 *   refetch:              function,
 *   coverage:             string,
 *   waste:                string,
 *   errors:               { coverage?: string, waste?: string },
 *   isSaving:             boolean,
 *   handleCoverageChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
 *   handleWasteChange:    (e: React.ChangeEvent<HTMLInputElement>) => void,
 *   handleSave:           () => Promise<void>
 * }}
 */
export function useSettingsForm() {
    // ── Server state ──────────────────────────────────────────────────────────
    const {
        data: settings,
        isLoading,
        isError,
        error,
        refetch,
    } = useMustasharSettings();

    // ── Local controlled-input state ──────────────────────────────────────────
    // Strings are used (not numbers) so inputs behave naturally while typing.
    const [coverage, setCoverage] = useState("");
    const [waste, setWaste]       = useState("10"); // sensible default before server data arrives
    const [errors, setErrors]     = useState({});

    // Seed form fields once settings load (or when they change after a save).
    useEffect(() => {
        if (!settings) return;
        setCoverage(settings.coverage != null ? String(settings.coverage) : "");
        setWaste(String(settings.waste ?? 10));
    }, [settings]);

    // ── Mutation ──────────────────────────────────────────────────────────────
    const updateSettings = useUpdateMustasharSettings();
    const isSaving = updateSettings.isPending;

    // ── Change handlers ───────────────────────────────────────────────────────

    /**
     * Updates the coverage input value and clears any existing coverage error
     * so the field feels responsive as the user types.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    function handleCoverageChange(e) {
        setCoverage(e.target.value);
        if (errors.coverage) setErrors((p) => ({ ...p, coverage: undefined }));
    }

    /**
     * Updates the waste input value and clears any existing waste error.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    function handleWasteChange(e) {
        setWaste(e.target.value);
        if (errors.waste) setErrors((p) => ({ ...p, waste: undefined }));
    }

    // ── Save handler ──────────────────────────────────────────────────────────

    /**
     * Validates both fields, then persists the settings via the mutation.
     *
     * Flow:
     *   1. Run client-side validators; collect all errors.
     *   2. If any errors exist, update state and show a toast — abort.
     *   3. Otherwise, call `mutateAsync`; show success or a server error toast.
     *
     * Server errors are unwrapped in order of specificity:
     *   `message` → `errors.coverage_per_unit[0]` → `errors.waste_percentage[0]` → generic fallback.
     *
     * @returns {Promise<void>}
     */
    async function handleSave() {
        const fieldErrors = {};

        // Validate coverage field.
        const coverageErr = validateCoverage(coverage);
        if (coverageErr) fieldErrors.coverage = coverageErr;

        // validateWaste returns { waste?: string } — merge into fieldErrors.
        const wasteErrs = validateWaste(waste);
        Object.assign(fieldErrors, wasteErrs);

        // Abort and surface all errors if validation failed.
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            toast.error("Please fix the highlighted fields before saving.");
            return;
        }

        setErrors({});

        try {
            await updateSettings.mutateAsync({
                coverage_per_unit: parseFloat(coverage),
                waste_percentage:  parseFloat(waste),
            });
            toast.success("Settings saved successfully.");
        } catch (err) {
            // Prefer specific server validation messages over a generic fallback.
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