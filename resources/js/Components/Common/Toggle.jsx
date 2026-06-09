/**
 * @file Toggle.jsx
 * @module Components/Common
 *
 * A self-contained, accessible toggle switch (`role="switch"`) with a
 * CSS-driven sliding thumb and smooth track colour transition.
 *
 * Design constraints:
 *   - **No external animation library** — all motion is pure CSS `transition`.
 *   - The sliding thumb uses `translateX` so it never triggers layout reflow.
 *   - The active track colour is read from the `--primary` CSS custom property,
 *     making the component theme-aware without any JavaScript involvement.
 *   - `box-shadow` is reserved for an optional glow ring; transitioning it
 *     in/out never shifts surrounding layout.
 *
 * Accessibility:
 *   - Renders as `<button role="switch" aria-checked={checked}>` so screen
 *     readers announce the on/off state correctly.
 *   - `disabled` prop dims the control and blocks pointer events.
 *
 * Used by: ProductRow
 */

import { useLang } from '@/Hooks/useLang';

/**
 * Toggle
 *
 * @param {object}   props
 * @param {boolean}  props.checked          - Controlled checked state.
 * @param {function} props.onChange         - Callback fired (with no arguments) on click.
 *                                            The parent is responsible for updating `checked`.
 * @param {boolean}  [props.disabled=false] - When true, blocks interaction and dims the switch.
 *
 * @returns {JSX.Element}
 */
export default function Toggle({ checked, onChange, disabled = false }) {
    const { isAr } = useLang();

    /*
     * The thumb starts on the reading-start side (left-1 in LTR, right-1 in RTL).
     * translateX direction must match: positive for LTR (move right toward ON),
     * negative for RTL (move left toward ON).
     */
    const thumbOffset = isAr ? -20 : 20;
    const translateX = checked ? `translateX(${thumbOffset}px)` : "translateX(0px)";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={isAr ? 'تبديل' : 'Toggle'}
            onClick={() => !disabled && onChange()}
            disabled={disabled}
            className={`
                relative inline-flex items-center flex-shrink-0
                w-11 h-6 rounded-full border-none p-0 outline-none
                transition-[background-color] duration-250 ease-linear
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
            style={{
                backgroundColor: checked ? "var(--primary)" : "#d1d5db",
            }}
        >
            <span
                className="absolute top-1 rtl:right-1 ltr:left-1 w-4 h-4 rounded-full bg-white"
                style={{
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transform: translateX,
                    transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange: "transform",
                }}
            />
        </button>
    );
}