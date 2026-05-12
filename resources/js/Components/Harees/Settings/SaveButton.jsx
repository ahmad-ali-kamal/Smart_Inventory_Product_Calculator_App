// Components/Settings/Harees/SaveButton.jsx
//
// Single Responsibility: render the save button and its error feedback.
// Handles three visual states: idle, saving, saved.
//
import { Save, AlertCircle } from 'lucide-react';

/**
 * @param {function} onSave         — async save handler
 * @param {boolean}  saving         — mutation in-flight
 * @param {boolean}  saved          — transient success flash
 * @param {boolean}  disabled       — true when there are active errors
 * @param {string}   saveError      — server error message (or null)
 */
export default function SaveButton({ onSave, saving, saved, disabled, saveError }) {
    const buttonClass = [
        'flex items-center justify-center gap-2 w-full max-w-md py-4 rounded-xl',
        'text-base font-bold transition-all shadow-none outline-none ring-0',
        disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : saved
                ? 'bg-emerald-500 text-white'
                : 'bg-[var(--primary)] text-white hover:brightness-95',
    ].join(' ');

    const label = saved ? 'Saved Successfully!' : saving ? 'Saving...' : 'Save All Settings';

    return (
        <div className="flex flex-col items-center justify-center pt-6 space-y-3">
            <button
                onClick={onSave}
                disabled={saving || disabled}
                className={buttonClass}
            >
                <Save size={18} />
                {label}
            </button>

            {saveError && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12} />
                    {saveError}
                </p>
            )}
        </div>
    );
}