/**
 * @file Toggle.jsx
 * @module Components/Common/UI
 *
 * @description
 * Animated boolean toggle switch.
 * Renders a pill-shaped button containing a spring-animated thumb that
 * slides between the off (left) and on (right) positions using Framer Motion.
 *
 * The spring physics are tuned for a snappy but natural feel:
 *   - High stiffness (400) for fast response.
 *   - Moderate damping (25) to eliminate excessive bounce.
 *   - Slight mass (0.8) for a sense of physical weight.
 *
 * Fully controlled — the parent owns the `checked` state and provides
 * an `onChange` handler. The component does not manage its own state.
 *
 * @example
 * // Inside a table row
 * <Toggle
 *   checked={product.is_active}
 *   onChange={() => handleToggle(product.id)}
 * />
 *
 * @example
 * // Disabled (read-only display)
 * <Toggle checked={true} onChange={() => {}} disabled />
 */

import { motion } from 'framer-motion';

/**
 * Toggle
 *
 * @param {Object}   props
 * @param {boolean}  props.checked          - Whether the toggle is in the ON state (controlled).
 * @param {Function} props.onChange         - Callback fired when the user clicks the toggle.
 *                                           No arguments are passed; the parent derives the next
 *                                           state from the current `checked` value.
 * @param {boolean}  [props.disabled=false] - When `true`, clicks are ignored and opacity is reduced
 *                                           to indicate the control is non-interactive.
 * @returns {JSX.Element}
 */
export default function Toggle({ checked, onChange, disabled = false }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange()}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-500 ${
                // Active: primary brand color. Inactive: neutral grey.
                checked ? "bg-[var(--primary)]" : "bg-gray-300"
            } ${
                // Disabled: reduce opacity + block pointer interactions
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
        >
            {/*
             * Animated thumb — slides between x:4 (off) and x:24 (on).
             * Spring physics: stiffness controls snap speed, damping controls
             * bounce, mass adds subtle physical weight to the motion.
             */}
            <motion.span
                animate={{
                    x: checked ? 24 : 4,   // 24 px → fully right; 4 px → fully left
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,         // Fast initial response
                    damping: 25,            // Prevents excessive overshoot
                    mass: 0.8,              // Slight inertia for natural feel
                }}
                className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
            />
        </button>
    );
}