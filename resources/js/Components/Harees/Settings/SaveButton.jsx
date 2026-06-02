/**
 * @file SaveButton.jsx
 * @module Components/Harees/Settings
 *
 * @description
 * Presentational component that renders the settings save button and its
 * associated server-error feedback.
 *
 * Three visual states are handled through prop-driven class composition:
 *  - idle    — primary colour background, "Save All Settings" label.
 *  - saving  — same appearance; button is disabled while the mutation is pending.
 *  - saved   — emerald background with "Saved Successfully!" label for 2.5 s.
 *  - error   — button resets to idle; an animated error message appears below.
 *  - disabled — grey background when active validation errors block saving.
 *
 * Single Responsibility: rendering only. State lives in `useInventorySettingsForm`.
 */

import { Save, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Save button with three visual states (idle / saving / saved) and optional
 * server error display.
 *
 * @param {object}   props
 * @param {function} props.onSave     — Async save handler called on click.
 * @param {boolean}  props.saving     — `true` while the mutation is in-flight;
 *                                      disables the button.
 * @param {boolean}  props.saved      — `true` for the 2.5 s success flash;
 *                                      switches the button to emerald.
 * @param {boolean}  props.disabled   — `true` when active validation errors exist;
 *                                      renders the button in a grey disabled state.
 * @param {string|null} props.saveError — Server error message from the last failed
 *                                      save attempt, or `null` when there is none.
 * @returns {JSX.Element}
 */
export default function SaveButton({ onSave, saving, saved, disabled, saveError }) {
    const { t } = useTranslation('harees');

    // Build the button class string from the current state combination.
    // Priority: disabled > saved > idle (saving uses the same style as idle).
    const buttonClass = [
        'flex items-center justify-center gap-2 w-full max-w-md py-4 rounded-xl',
        'text-base font-bold transition-all shadow-none outline-none ring-0',
        disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : saved
                ? 'bg-emerald-500 text-white'
                : 'bg-[var(--primary)] text-white hover:brightness-95',
    ].join(' ');

    // Derive the label from the current state; evaluated once per render.
    const label = saved
        ? t('save_button.label_saved')
        : saving
            ? t('save_button.label_saving')
            : t('save_button.label_save');

    return (
        <div className="flex flex-col items-center justify-center pt-6 space-y-3">

            {/* Save button — also disabled while saving to prevent double-submission */}
            <button
                onClick={onSave}
                disabled={saving || disabled}
                className={buttonClass}
            >
                <Save size={18} />
                {label}
            </button>

            {/* Server error message — only rendered when saveError is non-null */}
            {saveError && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12} />
                    {saveError}
                </p>
            )}

        </div>
    );
}