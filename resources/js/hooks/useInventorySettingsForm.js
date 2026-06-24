/**
 * @file useInventorySettingsForm.js
 * @module Hooks
 *
 * @description
 * Custom React hook that owns the complete lifecycle of the Harees Inventory
 * Settings form.
 *
 * Responsibilities:
 *  - Fetches current settings from the server via React Query (`useInventorySettings`).
 *  - Hydrates five local state slices once server data arrives.
 *  - Validates numeric inputs against `FIELD_RULES` and accumulates per-field errors.
 *  - Manages automation toggles and drag-and-drop category reassignment.
 *  - Derives `activeErrors` — suppressing discount errors when the autoDiscount
 *    toggle is off — to prevent the save button from being blocked by hidden fields.
 *  - Persists form state via `useUpdateInventorySettings` and surfaces
 *    success / error feedback through react-hot-toast.
 *
 * Separation of concerns:
 *  - Server state  → React Query (caching, refetching, mutations).
 *  - UI form state → useState (controlled inputs, toggles, drag state).
 *  - Derived state → useMemo (activeErrors).
 *  - Side effects  → toast notifications only.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
    useInventorySettings,
    useUpdateInventorySettings,
} from "./useInventory";
import {
    DEFAULT_THRESHOLDS,
    DEFAULT_AUTOMATION,
    DEFAULT_DISCOUNT,
    DEFAULT_CATEGORIES,
    DEFAULT_YELLOW_LABEL,
    YELLOW_BATCH_LABELS,
    FIELD_RULES,
    validateNumericField,
    buildPayload,
    hydrateFromServer,
} from "../constants/inventorySettings";

// ---------------------------------------------------------------------------
// Group → setter key mapping
// Used by handleInputChange to route field updates to the correct state slice.
// Explicit map prevents silent failures when an unknown group name is passed.
// ---------------------------------------------------------------------------
const GROUP_SETTERS = {
    thresholds: "setThresholds",
    discount: "setDiscountConfig",
};

/**
 * Manages form state, validation, drag-and-drop, and server synchronisation
 * for the Harees Inventory Settings page.
 *
 * @returns {{
 *   isLoading:        boolean,
 *   isError:          boolean,
 *   error:            Error|null,
 *   refetch:          function,
 *   thresholds:       { short: number|string, medium: number|string, long: number|string },
 *   automation:       { autoHide: boolean, autoDiscount: boolean },
 *   discountConfig:   { percent: number|string, durationDays: number|string },
 *   categories:       { short: string[], medium: string[], long: string[] },
 *   unassigned:       string[],
 *   errors:           Record<string, string>,
 *   saving:           boolean,
 *   saved:            boolean,
 *   saveError:        string|null,
 *   hasActiveErrors:  boolean,
 *   handleInputChange: function,
 *   handleToggle:      function,
 *   handleDragStart:   function,
 *   handleDrop:        function,
 *   handleSave:        function,
 * }}
 */
export function useInventorySettingsForm() {
    // ── Server state (React Query) ──────────────────────────────────────────
    const { data, isLoading, isError, error, refetch } = useInventorySettings();

    const { mutateAsync: updateInventorySettings } =
        useUpdateInventorySettings();

    // ── Local form state ────────────────────────────────────────────────────
    const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
    const [automation, setAutomation] = useState(DEFAULT_AUTOMATION);
    const [discountConfig, setDiscountConfig] = useState(DEFAULT_DISCOUNT);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [yellowLabel, setYellowLabel] = useState(DEFAULT_YELLOW_LABEL);

    /** Categories not yet assigned to any expiry bucket. */
    const [unassigned, setUnassigned] = useState([]);

    /** Per-field validation errors keyed as `"group.field"` (e.g. `"thresholds.short"`). */
    const [errors, setErrors] = useState({});

    /** True while the save mutation is in-flight. */
    const [saving, setSaving] = useState(false);

    /** Transient success flag — reset to false after 2.5 s. */
    const [saved, setSaved] = useState(false);

    /** Server error message from the last failed save attempt. */
    const [saveError, setSaveError] = useState(null);

    // ── Setter map (stable reference — not rebuilt each render) ────────────
    // Passed into handleInputChange via closure; useMemo prevents the callback
    // from being recreated when unrelated state changes.
    const setterMap = useMemo(
        () => ({ thresholds: setThresholds, discount: setDiscountConfig }),
        [],
    );

    // ── Hydrate form once server data arrives ───────────────────────────────
    // `hydrateFromServer` normalises the API response into the local state shape.
    useEffect(() => {
        if (!data) return;
        const hydrated = hydrateFromServer(data);
        setThresholds(hydrated.thresholds);
        setAutomation(hydrated.automation);
        setDiscountConfig(hydrated.discountConfig);
        setCategories(hydrated.categories);
        setUnassigned(hydrated.unassigned);
        setYellowLabel(hydrated.yellowLabel);
    }, [data]);

    // ── Shared numeric field handler (thresholds + discount fields) ─────────
    //
    // BUG FIX 1: value stored as Number, not String — buildPayload must send
    //            numeric types to the API, not "20" as a string.
    //
    // BUG FIX 2: removed the redundant replace() inside validateNumericField —
    //            the value already arrives stripped via `clean`.
    //
    // BUG FIX 3: unknown group throws in development so silent failures surface
    //            immediately during local development.
    //
    /**
     * Handles a change event on any numeric settings input.
     * Strips non-digit characters, updates the relevant state slice,
     * and runs field-level validation.
     *
     * @param {string} field    — Field key within the group (e.g. `"short"`, `"percent"`).
     * @param {string} rawValue — Raw string value from the input element.
     * @param {string} group    — State slice to update (`"thresholds"` or `"discount"`).
     */
    const handleInputChange = useCallback(
        (field, rawValue, group) => {
            const setter = setterMap[group];

            if (!setter) {
                if (process.env.NODE_ENV === "development") {
                    console.error(
                        `[useInventorySettingsForm] Unknown group "${group}" passed to handleInputChange. ` +
                            `Expected one of: ${Object.keys(GROUP_SETTERS).join(", ")}.`,
                    );
                }
                return;
            }

            // Strip all non-digit characters before storing or validating.
            const clean = rawValue.replace(/[^\d]/g, "");
            const rules = FIELD_RULES[field];
            const errorKey = `${group}.${field}`;

            // Store as Number so buildPayload sends numeric values to the API.
            // Preserve empty string so the input can be cleared mid-edit.
            const stored = clean === "" ? "" : Number(clean);
            setter((prev) => ({ ...prev, [field]: stored }));

            // Validate the cleaned value and update the errors map accordingly.
            const errMsg = validateNumericField(clean, rules.min, rules.max);
            setErrors((prev) => {
                const next = { ...prev };
                if (errMsg) {
                    next[errorKey] = errMsg;
                } else {
                    delete next[errorKey];
                }
                return next;
            });
        },
        [setterMap],
    );

    // ── Toggle an automation flag ───────────────────────────────────────────
    /**
     * Flips the boolean value of a single automation flag.
     *
     * @param {string} key — Automation flag key (e.g. `"autoHide"`, `"autoDiscount"`).
     */
    const handleToggle = useCallback((key) => {
        setAutomation((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    /**
     * Updates the yellow batch label selection.
     *
     * @param {string} label — The selected yellow batch label.
     */
    const handleYellowLabelChange = useCallback((label) => {
        setYellowLabel(label);
    }, []);

    // ── Drag-and-drop handlers ──────────────────────────────────────────────

    /**
     * Stores the dragged category label and its source bucket in the
     * drag event's data transfer object.
     *
     * @param {DragEvent} e          — Native drag event.
     * @param {string}    label      — Category label being dragged.
     * @param {string}    fromBucket — Source bucket key (or `"unassigned"`).
     */
    const handleDragStart = useCallback((e, label, fromBucket) => {
        e.dataTransfer.setData("label", label);
        e.dataTransfer.setData("from", fromBucket);
    }, []);

    /**
     * Handles a drop event on a bucket column.
     * Moves the dragged category from its source to the target bucket,
     * or from the unassigned pool to a bucket.
     *
     * No-ops when the source and target bucket are identical.
     *
     * @param {DragEvent} e        — Native drop event.
     * @param {string}    toBucket — Target bucket key.
     */
    const handleDrop = useCallback((e, toBucket) => {
        e.preventDefault();
        const label = e.dataTransfer.getData("label");
        const from = e.dataTransfer.getData("from");

        // Dropping onto the same bucket — nothing to do.
        if (from === toBucket) return;

        if (from === "unassigned") {
            // Move from the unassigned pool into the target bucket.
            setUnassigned((prev) => prev.filter((c) => c !== label));
            setCategories((prev) => ({
                ...prev,
                [toBucket]: [...prev[toBucket], label],
            }));
        } else {
            // Move between two named buckets.
            setCategories((prev) => ({
                ...prev,
                [from]: prev[from].filter((c) => c !== label),
                [toBucket]: [...prev[toBucket], label],
            }));
        }
    }, []);

    // ── Derived: active errors ──────────────────────────────────────────────
    //
    // BUG FIX 4: wrapped in useMemo — previously recalculated on every render
    //            even when errors / automation were unchanged.
    //
    // Discount field errors are excluded when the autoDiscount toggle is off
    // because those fields are hidden from the UI and cannot be corrected.
    const activeErrors = useMemo(() => {
        const active = { ...errors };
        if (!automation.autoDiscount) {
            delete active["discount.percent"];
            delete active["discount.durationDays"];
        }
        return active;
    }, [errors, automation.autoDiscount]);

    /** True when any validation error is currently active and visible. */
    const hasActiveErrors = Object.keys(activeErrors).length > 0;

    // ── Save ────────────────────────────────────────────────────────────────
    /**
     * Validates the form, then persists all settings to the server.
     *
     * Flow:
     *  1. Bail out immediately if active errors exist.
     *  2. Set saving=true and clear any previous server error.
     *  3. Call `updateInventorySettings` with the serialised payload.
     *  4. On success → flash the saved state for 2.5 s + success toast.
     *  5. On failure → capture the server error message + error toast.
     *  6. Always → set saving=false in the finally block.
     *
     * @returns {Promise<void>}
     */
    const handleSave = useCallback(async () => {
        if (hasActiveErrors) return;

        setSaving(true);
        setSaveError(null);

        try {
            await updateInventorySettings(
                buildPayload({
                    thresholds,
                    automation,
                    discountConfig,
                    categories,
                    yellowLabel,
                }),
            );

            setSaved(true);
            toast.success("Settings saved successfully.");
            // Reset the success flash after 2.5 s so it can fire again on the next save.
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            // Prefer the most specific server message; fall back to the JS error.
            const msg =
                err?.response?.data?.message ||
                err.message ||
                "Failed to save settings";
            setSaveError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }, [
        hasActiveErrors,
        updateInventorySettings,
        thresholds,
        automation,
        discountConfig,
        categories,
    ]);

    return {
        // Query state — passed through so the page can render skeleton / error UI.
        isLoading,
        isError,
        error,
        refetch,
        // Form state slices
        thresholds,
        automation,
        discountConfig,
        categories,
        unassigned,
        yellowLabel,
        errors,
        saving,
        saved,
        saveError,
        hasActiveErrors,
        // Handlers
        handleInputChange,
        handleToggle,
        handleYellowLabelChange,
        handleDragStart,
        handleDrop,
        handleSave,
    };
}
