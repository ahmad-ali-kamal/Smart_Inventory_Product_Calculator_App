/**
 * @file Toggle.jsx
 * @module Components/Common
 *
 * A self-contained, accessible toggle switch (role="switch") with a
 * CSS-driven sliding thumb and a brief glow-ring on state change.
 *
 * Design constraints:
 *   - No external animation library — all motion is pure CSS transition.
 *   - The glow is carried by box-shadow so it never shifts surrounding layout.
 *   - Active color is pulled from the `--primary` CSS custom property,
 *     making it theme-aware without any JavaScript involvement.
 *
 * Used by: ProductRow
 */

import { useRef, useEffect, useState } from "react";

// ── i18n strings ──────────────────────────────────────────────────────────────
// Hoist to your translation JSON and replace with useTranslation() when ready.
// No strings are rendered as visible text in this component; the object is a
// placeholder so the pattern is consistent across the codebase.
const t = {};

/**
 * Toggle
 *
 * @param {object}   props
 * @param {boolean}  props.checked            - Controlled checked state.
 * @param {function} props.onChange           - Callback fired (with no arguments) on click.
 * @param {boolean}  [props.disabled=false]   - Blocks interaction and dims the switch when true.
 *
 * @returns {JSX.Element}
 */
export default function Toggle({ checked, onChange, disabled = false }) {
    // Suppress the glow on the initial mount — it should only fire on real user interactions.
    const isFirstRender = useRef(true);
    // Track the previous value so the glow only plays when the state genuinely flips.
    const prevChecked   = useRef(checked);
    const [glowing, setGlowing] = useState(false);

    useEffect(() => {
        // Skip the very first render — no interaction has occurred yet.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevChecked.current   = checked;
            return;
        }

        // Only trigger the glow when `checked` actually changed value.
        if (prevChecked.current !== checked) {
            prevChecked.current = checked;
            setGlowing(true);
            // Auto-clear the glow after 600 ms (comfortably past the 250 ms thumb slide).
            const timer = setTimeout(() => setGlowing(false), 600);
            return () => clearTimeout(timer);
        }
    }, [checked]);

    // Glow color reflects the new state: purple when active, neutral gray when inactive.
    const glowColor = checked
        ? "rgba(124, 58, 237, 0.28)"   // active  — matches --primary purple tint
        : "rgba(156, 163, 175, 0.32)"; // inactive — neutral gray

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
                // Track background transitions in sync with the thumb slide (250 ms).
                backgroundColor:  checked ? "var(--primary)" : "#d1d5db",
                // box-shadow carries the glow ring — transitions both in and out smoothly.
                boxShadow:        glowing
                    ? `0 0 0 3px ${glowColor}, 0 0 10px 1px ${glowColor}`
                    : "0 0 0 0px transparent",
                transition:      "background-color 0.25s ease, box-shadow 0.2s ease",
                flexShrink:       0,
                outline:         "none",
            }}
        >
            {/* Sliding thumb — translateX drives the on/off position */}
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
