/**
 * @file calculatorSettings.js
 * @module Config/Calculator
 *
 * @description
 * Single source of truth for the Quantix Smart Calculator's validation rules
 * and shared utility functions.
 *
 * Exports:
 *  - Boundary constants (`COVERAGE_MIN`, `COVERAGE_MAX`, `WASTE_MIN`, `WASTE_MAX`)
 *    that are intentionally kept in sync with the Laravel backend validation rules.
 *  - `roundSafe`    — floating-point-safe rounding helper.
 *  - `validateFields` — field-level form validator that returns an error map.
 *
 * All user-facing error strings are defined in the `t` object so they can be
 * migrated to a JSON translation file (e.g. via i18next) without touching logic.
 */

// ---------------------------------------------------------------------------
// i18n placeholder — move these strings to your translation JSON when ready
// ---------------------------------------------------------------------------

/** @type {Object.<string, string>} Validation error messages, ready for i18n extraction. */
const t = {
    coverage_invalid: "Enter a valid coverage value",
    coverage_min: "Coverage must be at least {{min}} m²",
    coverage_max: "Coverage cannot exceed {{max}} m² per unit",
    waste_invalid: "Enter a valid waste percentage",
    waste_negative: "Waste percentage cannot be negative",
    waste_max: "Waste percentage cannot exceed {{max}}%",
};

// ---------------------------------------------------------------------------
// Validation constants — single source of truth, synced with backend rules
// ---------------------------------------------------------------------------

/** @constant {number} COVERAGE_MIN — Minimum allowed coverage value (m²). */
export const COVERAGE_MIN = 0.01;

/** @constant {number} COVERAGE_MAX — Maximum allowed coverage value per unit (m²). */
export const COVERAGE_MAX = 200;

/** @constant {number} WASTE_MIN — Minimum allowed waste percentage (inclusive zero). */
export const WASTE_MIN = 0;

/** @constant {number} WASTE_MAX — Maximum allowed waste percentage. */
export const WASTE_MAX = 50;

// ---------------------------------------------------------------------------
// roundSafe — avoids floating-point drift (e.g. 0.1 + 0.2 !== 0.3)
// ---------------------------------------------------------------------------

/**
 * Rounds a number to the given decimal places using an exponent-string trick
 * that avoids the floating-point representation errors inherent in
 * `Math.round(n * 10^d) / 10^d`.
 *
 * @param {number} n        — The number to round.
 * @param {number} decimals — Desired decimal places (non-negative integer).
 * @returns {number} The rounded value, free from floating-point drift.
 *
 * @example
 * roundSafe(1.005, 2); // → 1.01  (not 1.00 as with naive rounding)
 */
export function roundSafe(n, decimals) {
    const d = Math.max(0, decimals | 0);
    return Number(Math.round(+(n + Number.EPSILON) + "e" + d) + "e-" + d);
}

// ---------------------------------------------------------------------------
// validateFields — returns an object of field-level error messages (or {})
// ---------------------------------------------------------------------------

/**
 * Validates the `coverage` and `waste` fields against the shared boundary
 * constants and returns a map of field-level error messages.
 *
 * Returns an empty object (`{}`) when all fields are valid — making it easy
 * to gate form submission with `Object.keys(errors).length === 0`.
 *
 * @param {string|number} coverage — Raw coverage input value (may be an empty string).
 * @param {string|number} waste    — Raw waste-percentage input value (may be an empty string).
 * @returns {{ coverage?: string, waste?: string }} An error map keyed by field name.
 *
 * @example
 * const errors = validateFields("", 10);
 * // → { coverage: "Enter a valid coverage value" }
 */
export function validateFields(coverage, waste) {
    const errors = {};

    // ── Coverage validation ──────────────────────────────────────────────────
    const coverageNum = parseFloat(coverage);
    if (coverage === "" || isNaN(coverageNum)) {
        errors.coverage = t.coverage_invalid;
    } else if (coverageNum < COVERAGE_MIN) {
        // Interpolate the boundary value into the message template
        errors.coverage = t.coverage_min.replace("{{min}}", COVERAGE_MIN);
    } else if (coverageNum > COVERAGE_MAX) {
        errors.coverage = t.coverage_max.replace("{{max}}", COVERAGE_MAX);
    }

    // ── Waste validation ─────────────────────────────────────────────────────
    const wasteNum = parseFloat(waste);
    if (waste === "" || isNaN(wasteNum)) {
        errors.waste = t.waste_invalid;
    } else if (wasteNum < WASTE_MIN) {
        errors.waste = t.waste_negative;
    } else if (wasteNum > WASTE_MAX) {
        errors.waste = t.waste_max.replace("{{max}}", WASTE_MAX);
    }

    return errors;
}
