// ---------------------------------------------------------------------------
// Validation constants — single source of truth, synced with backend rules
// ---------------------------------------------------------------------------
export const COVERAGE_MIN = 0.01;
export const COVERAGE_MAX = 200;
export const WASTE_MIN = 0;
export const WASTE_MAX = 50;

// ---------------------------------------------------------------------------
// roundSafe — avoids floating-point drift (e.g. 0.1 + 0.2 !== 0.3)
// ---------------------------------------------------------------------------
export function roundSafe(n, decimals) {
    const d = Math.max(0, decimals | 0);
    return Number(Math.round(+(n + Number.EPSILON) + "e" + d) + "e-" + d);
}

// ---------------------------------------------------------------------------
// validateFields — returns an object of field-level error messages (or {})
// ---------------------------------------------------------------------------
export function validateFields(coverage, waste) {
    const errors = {};

    const coverageNum = parseFloat(coverage);
    if (coverage === "" || isNaN(coverageNum)) {
        errors.coverage = "Enter a valid coverage value";
    } else if (coverageNum < COVERAGE_MIN) {
        errors.coverage = `Coverage must be at least ${COVERAGE_MIN} m²`;
    } else if (coverageNum > COVERAGE_MAX) {
        errors.coverage = `Coverage cannot exceed ${COVERAGE_MAX} m² per unit`;
    }

    const wasteNum = parseFloat(waste);
    if (waste === "" || isNaN(wasteNum)) {
        errors.waste = "Enter a valid waste percentage";
    } else if (wasteNum < WASTE_MIN) {
        errors.waste = "Waste percentage cannot be negative";
    } else if (wasteNum > WASTE_MAX) {
        errors.waste = `Waste percentage cannot exceed ${WASTE_MAX}%`;
    }

    return errors;
}