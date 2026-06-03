/**
 * @file inventorySettings.js
 * @module Utils/Inventory
 *
 * @description
 * Pure constants and utility functions for the Harees inventory management system.
 * No React dependencies — fully unit-testable in isolation.
 *
 * Exports:
 *  - `BUCKET_CONFIG`       — UI and mapping configuration for the three product-lifecycle buckets.
 *  - `DEFAULT_THRESHOLDS`  — Default day-count values for each bucket.
 *  - `DEFAULT_AUTOMATION`  — Default state for the auto-hide / auto-discount toggles.
 *  - `DEFAULT_DISCOUNT`    — Default discount percentage and duration.
 *  - `DEFAULT_CATEGORIES`  — Default (empty) category assignment map.
 *  - `FIELD_RULES`         — Min/max validation boundaries keyed by field name.
 *  - `validateNumericField` — Validates a single cleaned numeric field against its rules.
 *  - `buildPayload`         — Maps internal React state to the outbound API contract.
 *  - `hydrateFromServer`    — Maps an API response back to internal React state shape.
 *
 * All user-facing validation error strings are defined in the `t` object so
 * they can be migrated to a JSON translation file (e.g. via i18next) without
 * touching any logic.
 */

// utils/inventorySettings.js
// Pure constants and helpers — no React, fully unit-testable.

// ---------------------------------------------------------------------------
// i18n placeholder for future translation
// ---------------------------------------------------------------------------

import i18n from "../i18n";

// ---------------------------------------------------------------------------
// Bucket configuration — drives both the drag-drop UI and category mapping
// ---------------------------------------------------------------------------

/**
 * Ordered configuration array for the three product-lifecycle buckets.
 * Consumed by the drag-drop UI to render column headers and by the category
 * mapping logic to iterate over valid bucket keys.
 *
 * @type {Array<{
 *   key:         "short" | "medium" | "long",
 *   label:       string,
 *   dot:         string,
 *   count_color: string
 * }>}
 */
export const BUCKET_CONFIG = [
    {
        /** Internal key used for state lookups and API mapping. */
        key: "short",
        /** Display label shown in the drag-drop column header. */
        label: "Short-term",
        /** Tailwind class for the colored dot indicator beside the label. */
        dot: "bg-[var(--primary)]",
        /** Tailwind class for the product-count number beside the label. */
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

/**
 * Default threshold values (in days) for each lifecycle bucket.
 * Used to initialise the settings form before server data is loaded.
 *
 * @type {{ short: number, medium: number, long: number }}
 */
export const DEFAULT_THRESHOLDS = { short: 10, medium: 10, long: 10 };

/**
 * Default state for the automation toggle switches.
 * Both are off by default; the user opts in explicitly.
 *
 * @type {{ autoHide: boolean, autoDiscount: boolean }}
 */
export const DEFAULT_AUTOMATION = { autoHide: false, autoDiscount: false };

/**
 * Default discount configuration applied when auto-discount is first enabled.
 *
 * @type {{ percent: number, durationDays: number }}
 */
export const DEFAULT_DISCOUNT = { percent: 20, durationDays: 7 };

/**
 * Default (empty) category assignment map — no categories assigned to any bucket.
 * Each key holds an array that grows as the user drags categories into buckets.
 *
 * @type {{ short: Array, medium: Array, long: Array }}
 */
export const DEFAULT_CATEGORIES = { short: [], medium: [], long: [] };

// ---------------------------------------------------------------------------
// Field validation rules — used by handleInputChange
// ---------------------------------------------------------------------------

/**
 * Validation boundaries for every numeric input field in the settings form.
 * Keys match the field names used in the React state object so the hook can
 * look up rules dynamically via `FIELD_RULES[fieldName]`.
 *
 * @type {Object.<string, { min: number, max: number }>}
 *
 * @property {{ min: 1, max: 1095 }} short       — Short-term threshold (days).
 * @property {{ min: 1, max: 1095 }} medium      — Medium-term threshold (days).
 * @property {{ min: 1, max: 1095 }} long        — Long-term threshold (days).
 * @property {{ min: 1, max: 99  }} percent      — Auto-discount percentage.
 * @property {{ min: 1, max: 365 }} durationDays — Auto-discount active duration (days).
 */
export const FIELD_RULES = {
    // Lifecycle bucket thresholds — max 3 years (1095 days)
    short: { min: 1, max: 1095 },
    medium: { min: 1, max: 1095 },
    long: { min: 1, max: 1095 },
    // Discount configuration
    percent: { min: 1, max: 99 },
    durationDays: { min: 1, max: 365 },
};

// ---------------------------------------------------------------------------
// validateNumericField — returns an error string or null
// ---------------------------------------------------------------------------

/**
 * Validates a single pre-cleaned numeric field value against a min/max range.
 * Returns a human-readable error string when invalid, or `null` when valid.
 *
 * **Design note — why no internal replace() call:**
 * The caller (`handleInputChange`) already strips non-digit characters before
 * passing the value here. Repeating that strip would be redundant and would
 * mask the original raw input from any future logging or debugging.
 *
 * @param {string|undefined} clean — The cleaned input value (digits only, or empty string).
 * @param {number}           min   — Minimum allowed integer value (inclusive).
 * @param {number}           max   — Maximum allowed integer value (inclusive).
 * @returns {string|null} An i18n-ready error message string, or `null` if the value is valid.
 *
 * @example
 * validateNumericField("",   1, 365); // → "Required"
 * validateNumericField("0",  1, 365); // → "Limit: 1–365"
 * validateNumericField("30", 1, 365); // → null
 */
export function validateNumericField(clean, min, max) {
    // Treat empty or missing input as a required-field violation
    if (clean === "" || clean === undefined) {
        return i18n.t("inventory_settings.field_required", { ns: "harees" });
    }

    const n = parseInt(clean, 10);

    // Reject non-integers and out-of-range values
    if (isNaN(n) || n < min || n > max) {
        return i18n.t("inventory_settings.field_limit", { ns: "harees", min, max });
    }

    return null;
}

// ---------------------------------------------------------------------------
// buildPayload — maps internal state to the API contract
// ---------------------------------------------------------------------------

/**
 * Transforms the internal React state object into the flat payload shape
 * expected by the Harees settings API endpoint.
 *
 * **Design note — Number() cast on every numeric field:**
 * The state already stores numbers (enforced in the hook), but this cast acts
 * as a safety net to guarantee the API never receives strings, even if a future
 * regression allows a string to slip through state management.
 *
 * Boolean automation flags are serialised as `1` / `0` to match the Laravel
 * backend's integer-boolean convention.
 *
 * @param {Object}  params
 * @param {{ short: number, medium: number, long: number }}     params.thresholds
 *   Day-count thresholds for each lifecycle bucket.
 * @param {{ autoHide: boolean, autoDiscount: boolean }}        params.automation
 *   Automation toggle states.
 * @param {{ percent: number, durationDays: number }}           params.discountConfig
 *   Auto-discount percentage and active-window duration.
 * @param {{ short: Array, medium: Array, long: Array }}        params.categories
 *   Category assignment map (array of category identifiers per bucket).
 *
 * @returns {{
 *   short_term_days:              number,
 *   medium_term_days:             number,
 *   long_term_days:               number,
 *   auto_hide_expired:            0 | 1,
 *   auto_discounts:               0 | 1,
 *   auto_discount_percent:        number,
 *   auto_discount_duration_days:  number,
 *   category_mapping:             { short: Array, medium: Array, long: Array }
 * }} Flat API-ready payload object.
 */
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
        // Booleans → integer flags for Laravel's boolean casting
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

/**
 * Transforms a raw API response into the internal React state shape consumed
 * by the Harees settings hook and form components.
 *
 * Handles two response envelope formats:
 *  - `{ settings: { ... }, category_mapping: { ... }, unassigned_categories: [] }`
 *  - A flat object where settings fields are at the root level.
 *
 * Falls back to the corresponding `DEFAULT_*` constant whenever an expected
 * field is absent from the server response, ensuring the UI always has valid
 * initial values.
 *
 * @param {Object}   data                          — Raw API response object.
 * @param {Object}   [data.settings]               — Optional nested settings envelope.
 * @param {number}   [data.settings.short_term_days]
 * @param {number}   [data.settings.medium_term_days]
 * @param {number}   [data.settings.long_term_days]
 * @param {number}   [data.settings.auto_hide_expired]   — Stored as 0/1 by Laravel.
 * @param {number}   [data.settings.auto_discounts]      — Stored as 0/1 by Laravel.
 * @param {number}   [data.settings.auto_discount_percent]
 * @param {number}   [data.settings.auto_discount_duration_days]
 * @param {Object}   [data.category_mapping]             — Bucket-keyed category arrays.
 * @param {Array}    [data.unassigned_categories]        — Categories not yet assigned to any bucket.
 *
 * @returns {{
 *   thresholds:    { short: number, medium: number, long: number },
 *   automation:    { autoHide: boolean, autoDiscount: boolean },
 *   discountConfig:{ percent: number, durationDays: number },
 *   categories:    { short: Array, medium: Array, long: Array },
 *   unassigned:    Array
 * }} Hydrated internal state object.
 */
export function hydrateFromServer(data) {
    // Support both nested (`data.settings`) and flat response envelopes
    const s = data.settings || data;

    return {
        thresholds: {
            short: s.short_term_days ?? DEFAULT_THRESHOLDS.short,
            medium: s.medium_term_days ?? DEFAULT_THRESHOLDS.medium,
            long: s.long_term_days ?? DEFAULT_THRESHOLDS.long,
        },
        automation: {
            // Laravel stores these as 0/1 integers; coerce to proper booleans
            autoHide: Boolean(s.auto_hide_expired),
            autoDiscount: Boolean(s.auto_discounts),
        },
        discountConfig: {
            percent: s.auto_discount_percent ?? DEFAULT_DISCOUNT.percent,
            durationDays:
                s.auto_discount_duration_days ?? DEFAULT_DISCOUNT.durationDays,
        },
        categories: {
            // Category mapping lives on `data`, not `s`, as it's a separate top-level key
            short: data.category_mapping?.short ?? [],
            medium: data.category_mapping?.medium ?? [],
            long: data.category_mapping?.long ?? [],
        },
        // Categories not yet assigned to any bucket — populate the unassigned pool
        unassigned: data.unassigned_categories ?? [],
    };
}
