// hooks/useInventorySettingsForm.js
//
// Single Responsibility: own every piece of state and logic for the
// Harees Settings page. The page component becomes a pure render tree.
//
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
    FIELD_RULES,
    validateNumericField,
    buildPayload,
    hydrateFromServer,
} from "../constants/inventorySettings";

// Maps group name → its state setter key
// Prevents silent failures if an unknown group is passed
const GROUP_SETTERS = {
    thresholds: "setThresholds",
    discount: "setDiscountConfig",
};

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
    const [unassigned, setUnassigned] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // ── Setter map (stable ref, not rebuilt each render) ───────────────────
    const setterMap = useMemo(
        () => ({ thresholds: setThresholds, discount: setDiscountConfig }),
        [],
    );

    // ── Hydrate form once server data arrives ───────────────────────────────
    useEffect(() => {
        if (!data) return;
        const hydrated = hydrateFromServer(data);
        setThresholds(hydrated.thresholds);
        setAutomation(hydrated.automation);
        setDiscountConfig(hydrated.discountConfig);
        setCategories(hydrated.categories);
        setUnassigned(hydrated.unassigned);
    }, [data]);

    // ── Shared numeric field handler (thresholds + discount fields) ─────────
    //
    // BUG FIX 1: store value as Number, not String — buildPayload must send
    //            numeric types to the API, not "20" as a string.
    //
    // BUG FIX 2: removed the redundant replace() inside validateNumericField
    //            call — the field already arrives stripped via `clean`.
    //
    // BUG FIX 3: unknown group now throws in dev so silent failures surface
    //            immediately during development.
    //
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

            const clean = rawValue.replace(/[^\d]/g, "");
            const rules = FIELD_RULES[field];
            const errorKey = `${group}.${field}`;

            // Store as Number so buildPayload sends numeric values to the API.
            // Keep empty string as-is so the input field can be cleared while typing.
            const stored = clean === "" ? "" : Number(clean);
            setter((prev) => ({ ...prev, [field]: stored }));

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
    const handleToggle = useCallback((key) => {
        setAutomation((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // ── Drag-and-drop handlers ──────────────────────────────────────────────
    const handleDragStart = useCallback((e, label, fromBucket) => {
        e.dataTransfer.setData("label", label);
        e.dataTransfer.setData("from", fromBucket);
    }, []);

    const handleDrop = useCallback((e, toBucket) => {
        e.preventDefault();
        const label = e.dataTransfer.getData("label");
        const from = e.dataTransfer.getData("from");

        if (from === toBucket) return;

        if (from === "unassigned") {
            setUnassigned((prev) => prev.filter((c) => c !== label));
            setCategories((prev) => ({
                ...prev,
                [toBucket]: [...prev[toBucket], label],
            }));
        } else {
            setCategories((prev) => ({
                ...prev,
                [from]: prev[from].filter((c) => c !== label),
                [toBucket]: [...prev[toBucket], label],
            }));
        }
    }, []);

    // ── Derived: active errors (discount errors ignored when toggle is off) ──
    //
    // BUG FIX 4: wrapped in useMemo — previously recalculated as a plain
    //            function on every render even when errors/automation unchanged.
    //
    const activeErrors = useMemo(() => {
        const active = { ...errors };
        if (!automation.autoDiscount) {
            delete active["discount.percent"];
            delete active["discount.durationDays"];
        }
        return active;
    }, [errors, automation.autoDiscount]);

    const hasActiveErrors = Object.keys(activeErrors).length > 0;

    // ── Save ────────────────────────────────────────────────────────────────
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
                }),
            );

            setSaved(true);
            toast.success("Settings saved successfully.");
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
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
        // Query state
        isLoading,
        isError,
        error,
        refetch,
        // Form state
        thresholds,
        automation,
        discountConfig,
        categories,
        unassigned,
        errors,
        saving,
        saved,
        saveError,
        hasActiveErrors,
        // Handlers
        handleInputChange,
        handleToggle,
        handleDragStart,
        handleDrop,
        handleSave,
    };
}
