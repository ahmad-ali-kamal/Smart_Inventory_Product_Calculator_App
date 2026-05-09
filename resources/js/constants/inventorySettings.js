// utils/inventorySettings.js
// Pure constants and helpers — no React, fully unit-testable.

// ---------------------------------------------------------------------------
// Bucket configuration — drives both the drag-drop UI and category mapping
// ---------------------------------------------------------------------------
export const BUCKET_CONFIG = [
    {
        key: "short",
        label: "Short-term",
        dot: "bg-[var(--primary)]",
        count_color: "text-[var(--primary)]",
    },
    {
        key: "medium",
        label: "Medium-term",
        dot: "bg-[var(--primary)]",
        count_color: "text-[var(--primary)]",
    },
    {
        key: "long",
        label: "Long-term",
        dot: "bg-[var(--primary)]",
        count_color: "text-[var(--primary)]",
    },
];

// ---------------------------------------------------------------------------
// Default state shapes — single source of truth
// ---------------------------------------------------------------------------
export const DEFAULT_THRESHOLDS = { short: 10, medium: 10, long: 10 };
export const DEFAULT_AUTOMATION = { autoHide: false, autoDiscount: false };
export const DEFAULT_DISCOUNT = { percent: 20, durationDays: 7 };
export const DEFAULT_CATEGORIES = { short: [], medium: [], long: [] };

// ---------------------------------------------------------------------------
// Field validation rules — used by handleInputChange
// ---------------------------------------------------------------------------
export const FIELD_RULES = {
    // thresholds
    short: { min: 1, max: 1095 },
    medium: { min: 1, max: 1095 },
    long: { min: 1, max: 1095 },
    // discount
    percent: { min: 1, max: 99 },
    durationDays: { min: 1, max: 365 },
};

// ---------------------------------------------------------------------------
// validateNumericField — returns an error string or null
//
// BUG FIX: removed the internal replace() call.
// The caller (handleInputChange) already strips non-digits before passing
// the value here. Doing it twice was redundant and masked the original input
// from any future logging/debugging that reads `rawValue`.
// ---------------------------------------------------------------------------
export function validateNumericField(clean, min, max) {
    if (clean === "" || clean === undefined) return "Required";
    const n = parseInt(clean, 10);
    if (isNaN(n) || n < min || n > max) return `Limit: ${min}–${max}`;
    return null;
}

// ---------------------------------------------------------------------------
// buildPayload — maps internal state to the API contract
//
// BUG FIX: Number() cast on every numeric field.
// State stores numbers already (fixed in the hook), but this is a safety net
// so the API never receives strings even if something slips through.
// ---------------------------------------------------------------------------
export function buildPayload({
    thresholds,
    automation,
    discountConfig,
    categories,
}) {
    return {
        short_term_days: Number(thresholds.short),
        medium_term_days: Number(thresholds.medium),
        long_term_days: Number(thresholds.long),
        auto_hide_expired: automation.autoHide ? 1 : 0,
        auto_discounts: automation.autoDiscount ? 1 : 0,
        auto_discount_percent: Number(discountConfig.percent),
        auto_discount_duration_days: Number(discountConfig.durationDays),
        category_mapping: categories,
    };
}

// ---------------------------------------------------------------------------
// hydrateFromServer — maps API response to internal state shape
// ---------------------------------------------------------------------------
export function hydrateFromServer(data) {
    const s = data.settings || data;

    return {
        thresholds: {
            short: s.short_term_days ?? DEFAULT_THRESHOLDS.short,
            medium: s.medium_term_days ?? DEFAULT_THRESHOLDS.medium,
            long: s.long_term_days ?? DEFAULT_THRESHOLDS.long,
        },
        automation: {
            autoHide: Boolean(s.auto_hide_expired),
            autoDiscount: Boolean(s.auto_discounts),
        },
        discountConfig: {
            percent: s.auto_discount_percent ?? DEFAULT_DISCOUNT.percent,
            durationDays:
                s.auto_discount_duration_days ?? DEFAULT_DISCOUNT.durationDays,
        },
        categories: {
            short: data.category_mapping?.short ?? [],
            medium: data.category_mapping?.medium ?? [],
            long: data.category_mapping?.long ?? [],
        },
        unassigned: data.unassigned_categories ?? [],
    };
}
