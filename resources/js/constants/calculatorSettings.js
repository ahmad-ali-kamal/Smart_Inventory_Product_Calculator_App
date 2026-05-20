// resources/js/constants/calculatorSettings.js

export const WASTE_MIN = 0;
export const WASTE_MAX = 50;
export const COVERAGE_MIN = 0.01;
export const COVERAGE_MAX = 200;

export const DIMENSION_MIN = 0.01;
export const DIMENSION_MAX = 1000;

export function roundSafe(n, decimals) {
    const d = Math.max(0, decimals | 0);
    return Number(Math.round(+(n + Number.EPSILON) + "e" + d) + "e-" + d);
}

/**
 * Validates waste_percentage — required.
 * Returns { waste?: string } error object.
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
 * Validates coverage_per_unit — required.
 * Returns an error string or null.
 */
export function validateCoverage(value) {
    const num = parseFloat(value);

    if (value === "" || value === null || isNaN(num))
        return "Coverage is required (e.g. 2.56).";
    if (num <= 0) return "Coverage must be greater than zero.";
    if (num < COVERAGE_MIN)
        return `Coverage must be at least ${COVERAGE_MIN} m².`;
    if (num > COVERAGE_MAX) return `Coverage can't exceed ${COVERAGE_MAX} m².`;

    return null;
}

/**
 * Validates a customer-facing dimension (length / width).
 * Returns an error string or null.
 */
export function validateDimension(value, label = "Value") {
    const num = parseFloat(value);

    if (value === "" || value === null || isNaN(num))
        return `Please enter a valid ${label.toLowerCase()}.`;
    if (num <= 0) return `${label} must be greater than zero.`;
    if (num < DIMENSION_MIN)
        return `${label} must be at least ${DIMENSION_MIN} m.`;
    if (num > DIMENSION_MAX) return `${label} can't exceed ${DIMENSION_MAX} m.`;

    return null;
}
