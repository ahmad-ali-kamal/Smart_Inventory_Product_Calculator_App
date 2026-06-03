/**
 * @file HintBox.jsx
 * @module Components/Common/UI
 *
 * @description
 * Shared presentational component that renders a styled info/hint box.
 *
 * Responsibilities:
 *  - Displays an `AlertCircle` icon alongside a text message.
 *  - Provides a consistent visual language for contextual hints across cards
 *    (e.g. ThresholdCard, AutomationCard).
 *
 * Single Responsibility: rendering only. No state, no logic.
 */

import { AlertCircle } from 'lucide-react';

/**
 * A styled hint/info box with an icon and message.
 *
 * @param {object} props
 * @param {string} props.message — The hint text to display.
 * @returns {JSX.Element}
 */
export default function HintBox({ message }) {
    return (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/60 dark:bg-[var(--secondary)]/30 dark:border-[var(--border)]/60">
            <AlertCircle
                size={13}
                className="flex-shrink-0 mt-0.5 text-[var(--primary)] dark:text-[var(--primary)]/80"
            />
            <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)] dark:text-[var(--muted-foreground)]/80">
                {message}
            </p>
        </div>
    );
}