/**
 * @file useSettingsForm.js
 * @module Hooks
 *
 * @description
 * Custom React hook that owns the full lifecycle of the Mustashar Settings form.
 *
 * Responsibilities:
 *  - Fetches current settings from the server via React Query (`useCalculatorSettings`).
 *  - Hydrates controlled local state (coverage, waste) once server data arrives.
 *  - Validates field values against the shared `calculatorSettings` constants before
 *    allowing a save attempt.
 *  - Calls `useUpdateCalculatorSettings` to persist changes, then surfaces
 *    success / error feedback via react-hot-toast.
 *
 * Separation of concerns:
 *  - Server state  → React Query (caching, refetching, mutations).
 *  - UI form state → useState (controlled inputs, validation errors).
 *  - Side effects  → toast notifications only; no direct DOM access.
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useCalculatorSettings,
    useUpdateCalculatorSettings,
} from "./useProducts";
import {
    COVERAGE_MIN,
    COVERAGE_MAX,
    WASTE_MIN,
    WASTE_MAX,
    validateFields,
} from "../constants/calculatorSettings";

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
    // ── Server state (React Query) ──────────────────────────────────────────
    // `settings` shape: { coverage: number, waste: number, configured: boolean }
    const {
        data: settings,
        isLoading,
        isError,
        error,
        refetch,
    } = useCalculatorSettings();

    // ── Local form state ────────────────────────────────────────────────────
    // Stored as strings so number inputs remain fully controlled without
    // fighting React's synthetic event normalisation.
    const [coverage, setCoverage] = useState("8");
    const [waste, setWaste] = useState("10");

    /** Per-field validation error messages keyed by field name. */
    const [errors, setErrors] = useState({});

    // Hydrate form once server data arrives (or changes).
    // Using String() ensures the controlled inputs never receive `undefined`.
    useEffect(() => {
        if (settings) {
            setCoverage(String(settings.coverage ?? 8));
            setWaste(String(settings.waste ?? 10));
        }
    }, [settings]);

    // ── Mutation ────────────────────────────────────────────────────────────
    const updateSettings = useUpdateCalculatorSettings();

    /** True while the POST request is in-flight — used to disable the save button. */
    const isSaving = updateSettings.isPending;

    // ── Handlers ────────────────────────────────────────────────────────────

    /**
     * Updates the `coverage` field value and clears any existing coverage error
     * so the user gets immediate visual feedback as they type.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    function handleCoverageChange(e) {
        setCoverage(e.target.value);
        // Eagerly clear the field error to avoid stale red state while the user edits.
        if (errors.coverage)
            setErrors((prev) => ({ ...prev, coverage: undefined }));
    }

    /**
     * Updates the `waste` field value and clears any existing waste error.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
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
            // Prefer the most granular Laravel validation message available,
            // falling back to a generic copy if the server returns nothing useful.
            const serverMsg =
                err?.response?.data?.message ||
                err?.response?.data?.errors?.coverage_per_unit?.[0] ||
                err?.response?.data?.errors?.waste_percentage?.[0] ||
                "Failed to save settings. Please try again.";
            toast.error(serverMsg);
        }
    }

    return {
        // Query state — passed through so the page can render skeleton / error UI.
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
