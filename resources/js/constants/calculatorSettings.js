// ---------------------------------------------------------------------------
// Validation constants — single source of truth, synced with backend rules
// ---------------------------------------------------------------------------
export const COVERAGE_MIN = 0.01;
export const COVERAGE_MAX = 200;
export const WASTE_MIN = 0;
export const WASTE_MAX = 50;
export const PREVIEW_AREA = 25; // m² used for the live preview simulation

// ---------------------------------------------------------------------------
// roundSafe — avoids floating-point drift (e.g. 0.1 + 0.2 !== 0.3)
// ---------------------------------------------------------------------------
export function roundSafe(n, decimals) {
    const d = Math.max(0, decimals | 0);
    return Number(Math.round(+(n + Number.EPSILON) + "e" + d) + "e-" + d);
}

// ---------------------------------------------------------------------------
// computePreview — mirrors the actual calculation engine used in the snippet
// ---------------------------------------------------------------------------
export function computePreview({
    length,
    width,
    wastePct,
    coveragePerUnit,
    unitPrice = 0,
}) {
    if (!Number.isFinite(coveragePerUnit) || coveragePerUnit <= 0) {
        return { area: 0, units: 0, finalPrice: 0 };
    }

    const area = roundSafe(Math.max(0, length) * Math.max(0, width), 4);
    const wasteFactor = roundSafe(1 + Math.max(0, wastePct) / 100, 6);
    const areaWithWaste = roundSafe(area * wasteFactor, 4);
    const rawUnits = roundSafe(areaWithWaste / coveragePerUnit, 6);
    const units = Math.ceil(rawUnits);
    const unitPriceSafe =
        Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;
    const finalPrice = roundSafe(units * unitPriceSafe, 2);

    return { area, units, finalPrice };
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
