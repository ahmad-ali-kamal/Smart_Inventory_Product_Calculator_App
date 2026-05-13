/**
 * @file SettingsForm.jsx
 * @module Components/Mustashar/Settings
 *
 * @description
 * Presentational card component that lays out the full Mustashar Calculator
 * Settings form. Contains no business logic of its own — all values and
 * handlers are received as props from the `Settings` page via `useSettingsForm`.
 *
 * Structure:
 *  ┌──────────────────────────────────────────┐
 *  │  Card header (icon + title + subtitle)   │
 *  ├──────────────────────────────────────────│
 *  │  SettingsField — Unit Coverage           │
 *  │  SettingsField — Waste Percentage        │
 *  ├──────────────────────────────────────────│
 *  │  Save button (with loading spinner)      │
 *  └──────────────────────────────────────────┘
 *
 * Used by: Pages/Mustashar/Settings.jsx
 */

import { Loader2, SlidersHorizontal } from 'lucide-react';
import SettingsField from './SettingsField';
import {
    COVERAGE_MIN, COVERAGE_MAX,
    WASTE_MIN,    WASTE_MAX,
} from '../../../constants/calculatorSettings';

// ---------------------------------------------------------------------------
// i18n strings — move these values to your JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    // Card header
    card_title:           "Calculator Settings",
    card_subtitle:        "Configure calculation parameters for products",

    // Coverage field
    coverage_label:       "Unit Coverage (m²)",
    coverage_hint:        (min, max) => `Area covered by one unit — between ${min} and ${max} m²`,
    coverage_placeholder: "e.g., 2.56",

    // Waste field
    waste_label:       "Waste Percentage (%)",
    waste_hint:        (min, max) => `Extra safety margin — from ${min}% up to ${max}%`,
    waste_placeholder: "e.g., 10",

    // Save button
    btn_saving: "Saving...",
    btn_save:   "Save All Settings",
};

/**
 * Renders the settings card containing two `SettingsField` inputs and a save button.
 *
 * @param {object}   props
 * @param {string}   props.coverage         — Controlled value for the coverage input.
 * @param {string}   props.waste            — Controlled value for the waste input.
 * @param {{ coverage?: string, waste?: string }} props.errors
 *                                          — Validation error messages keyed by field name.
 * @param {boolean}  props.isSaving         — When `true`, the save button shows a spinner
 *                                            and is disabled.
 * @param {function} props.onCoverageChange — Change handler for the coverage input.
 * @param {function} props.onWasteChange    — Change handler for the waste input.
 * @param {function} props.onSave          — Click handler for the save button.
 * @returns {JSX.Element}
 */
export default function SettingsForm({
    coverage,
    waste,
    errors,
    isSaving,
    onCoverageChange,
    onWasteChange,
    onSave,
}) {
    return (
        <div className="bg-[var(--card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 text-[var(--foreground)]">

            {/* ── Card header ───────────────────────────────────────────── */}
            <div className="flex items-center gap-4 pb-2 border-b border-[var(--border)]">
                {/* Icon badge */}
                <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
                    <SlidersHorizontal size={24} />
                </div>

                {/* Title + subtitle */}
                <div>
                    <h1 className="text-xl font-black text-[var(--foreground)]">
                        {t.card_title}
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)] uppercase tracking-widest font-medium">
                        {t.card_subtitle}
                    </p>
                </div>
            </div>

            {/* ── Coverage input ─────────────────────────────────────────── */}
            <SettingsField
                label={t.coverage_label}
                hint={t.coverage_hint(COVERAGE_MIN, COVERAGE_MAX)}
                value={coverage}
                onChange={onCoverageChange}
                min={COVERAGE_MIN}
                max={COVERAGE_MAX}
                step="0.01"
                placeholder={t.coverage_placeholder}
                error={errors.coverage}
            />

            {/* ── Waste input ────────────────────────────────────────────── */}
            <SettingsField
                label={t.waste_label}
                hint={t.waste_hint(WASTE_MIN, WASTE_MAX)}
                value={waste}
                onChange={onWasteChange}
                min={WASTE_MIN}
                max={WASTE_MAX}
                step="0.1"
                placeholder={t.waste_placeholder}
                error={errors.waste}
            />

            {/* ── Save button ─────────────────────────────────────────────
                Disabled + shows a spinner while the mutation is in-flight.
                `active:scale-95` gives tactile press feedback on click.     */}
            <button
                onClick={onSave}
                disabled={isSaving}
                className={`
                    w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest
                    transition-all shadow-lg flex items-center justify-center gap-2
                    bg-[var(--primary)] text-white
                    ${isSaving
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:opacity-90 active:scale-95 shadow-indigo-500/20'
                    }
                `}
            >
                {isSaving ? (
                    <>
                        <Loader2 size={15} className="animate-spin" />
                        {t.btn_saving}
                    </>
                ) : (
                    t.btn_save
                )}
            </button>
        </div>
    );
}