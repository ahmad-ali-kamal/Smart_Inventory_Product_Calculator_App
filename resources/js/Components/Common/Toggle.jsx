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

import { useRef, useEffect, useState } from "react";

// ── i18n strings ──────────────────────────────────────────────────────────────
// No strings are rendered as visible text in this component; the object is a
// placeholder so the i18n pattern remains consistent across the codebase.
// Replace with `useTranslation()` calls when localisation is added.
const t = {};

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

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => !disabled && onChange()}
            disabled={disabled}
            style={{
                position:        "relative",
                display:         "inline-flex",
                alignItems:      "center",
                width:           "44px",
                height:          "24px",
                borderRadius:    "9999px",
                border:          "none",
                padding:          0,
                cursor:           disabled ? "not-allowed" : "pointer",
                opacity:          disabled ? 0.5 : 1,
                // Track colour transitions in sync with the thumb slide (250 ms).
                backgroundColor:  checked ? "var(--primary)" : "#d1d5db",
                // box-shadow carries the optional glow ring — transitions both in and out.
                boxShadow:        "none",
                transition:       "background-color 0.25s ease",
                flexShrink:       0,
                outline:         "none",
            }}
        >
            {/* ── Sliding thumb ────────────────────────────────────────────────
                translateX moves the thumb between the off (0 px) and on (20 px)
                positions. cubic-bezier easing gives a snappy-but-smooth feel.
            ─────────────────────────────────────────────────────────────────── */}
            <span
                style={{
                    position:        "absolute",
                    top:             "4px",
                    left:            "4px",
                    width:           "16px",
                    height:          "16px",
                    borderRadius:    "9999px",
                    backgroundColor: "#ffffff",
                    boxShadow:       "0 1px 3px rgba(0,0,0,0.2)",
                    transform:        checked ? "translateX(20px)" : "translateX(0px)",
                    transition:      "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange:      "transform",
                }}
            />
        </button>
    );
}