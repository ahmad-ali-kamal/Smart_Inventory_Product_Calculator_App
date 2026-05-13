// resources/js/constants/calculatorSettings.js
export const WASTE_MIN = 0;
export const WASTE_MAX = 100;

export const UNIT_TYPES = ['m2', 'cm2', 'mm2'];

export function roundSafe(n, decimals) {
    const d = Math.max(0, decimals | 0);
    return Number(Math.round(+(n + Number.EPSILON) + "e" + d) + "e-" + d);
}

export function validateFields(waste, unitType, minArea, maxArea) {
    const errors = {};

    const wasteNum = parseFloat(waste);
    if (waste === "" || isNaN(wasteNum)) {
        errors.waste = "Enter a valid waste percentage";
    } else if (wasteNum < WASTE_MIN) {
        errors.waste = "Waste percentage cannot be negative";
    } else if (wasteNum > WASTE_MAX) {
        errors.waste = `Waste percentage cannot exceed ${WASTE_MAX}%`;
    }

    if (!UNIT_TYPES.includes(unitType)) {
        errors.unit_type = "Select a valid unit type";
    }

    const minNum = parseFloat(minArea);
    const maxNum = parseFloat(maxArea);

    if (minArea !== "" && minArea !== null && !isNaN(minNum) && minNum < 0) {
        errors.min_input_area = "Minimum area cannot be negative";
    }

    if (maxArea !== "" && maxArea !== null && !isNaN(maxNum) && maxNum < 0) {
        errors.max_input_area = "Maximum area cannot be negative";
    }

    if (!isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
        errors.max_input_area = "Maximum area must be greater than minimum area";
    }

    return errors;
}