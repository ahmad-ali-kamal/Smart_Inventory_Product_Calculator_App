/**
 * @file calculatorSettings.js
 * @module Constants
 *
 * Shared validation rules and utility functions for the Mustashar smart
 * calculator. This module is the single source of truth for:
 *
 *   - Numeric range constraints (waste %, coverage).
 *   - Field-level validator functions consumed by both the Settings form
 *     (`useSettingsForm`) and the inline row editors (`ProductRow`).
 *   - A safe rounding helper used wherever calculated results are displayed.
 *
 * All validators return either a descriptive error string / object (on
 * failure) or null / an empty object (on success), so call-sites can render
 * errors directly without additional mapping.
 *
 * Used by: useSettingsForm, ProductRow, useToggleWithToast
 */

// ── Waste percentage bounds ───────────────────────────────────────────────────

/** Minimum allowed waste percentage (inclusive). */
export const WASTE_MIN = 0;

/** Maximum allowed waste percentage (inclusive). */
export const WASTE_MAX = 100;

// ── Coverage per-unit bounds ──────────────────────────────────────────────────

/** Minimum coverage a single unit may cover, in m² (exclusive of 0). */
export const COVERAGE_MIN = 0.01;

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Rounds a floating-point number to the specified number of decimal places
 * using the "round half away from zero" strategy (via string coercion).
 * Avoids floating-point drift for values like 1.005.
 *
 * @param {number} n        - The value to round.
 * @param {number} decimals - Number of decimal places (non-negative integer).
 * @returns {number} The rounded value.
 *
 * @example
 * roundSafe(1.005, 2); // → 1.01
 * roundSafe(9.999,  1); // → 10
 */
export function roundSafe(n, decimals) {
    const d = Math.max(0, decimals | 0);
    return Number(Math.round(+(n + Number.EPSILON) + "e" + d) + "e-" + d);
}

// ── Field validators ──────────────────────────────────────────────────────────

/**
 * Validates the `waste_percentage` field.
 *
 * Returns an errors object so it can be spread directly into a form-errors
 * state map: `{ waste?: string }`. An empty object `{}` signals valid input.
 *
 * @param {string|number|null} waste - Raw field value from the controlled input.
 * @returns {{ waste?: string }} Validation errors keyed by field name.
 */
export function validateWaste(waste) {
    const errors = {};
    const num = parseFloat(waste);

    if (waste === "" || waste === null || isNaN(num)) {
        errors.waste = "Waste percentage is required.";
    } else if (num < WASTE_MIN) {
        errors.waste = "Waste percentage can't be negative.";
    } else if (num > WASTE_MAX) {
        errors.waste = `Waste percentage can't exceed ${WASTE_MAX}%.`;
    }

    return errors;
}

/**
 * Validates the `coverage_per_unit` field.
 *
 * Returns a plain error string on failure and `null` on success, matching
 * the simpler single-field pattern used in `useSettingsForm` and `ProductRow`.
 *
 * @param {string|number|null} value - Raw field value from the controlled input.
 * @returns {string|null} Error message, or null if valid.
 */
export function validateCoverage(value) {
    const num = parseFloat(value);

    if (value === "" || value === null || isNaN(num))
        return "Coverage is required (e.g. 2.56).";
    if (num <= 0) return "Coverage must be greater than zero.";
    if (num < COVERAGE_MIN)
        return `Coverage must be at least ${COVERAGE_MIN} m².`;

    return null;
}