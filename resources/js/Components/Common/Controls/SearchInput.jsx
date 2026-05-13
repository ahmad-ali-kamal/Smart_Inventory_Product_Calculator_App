/**
 * @file SearchInput.jsx
 * @module Components/Common/Controls
 *
 * @description
 * Controlled search input used in table toolbars.
 * Optionally sanitizes user input to strip characters that are commonly
 * used in XSS payloads (`< > { } ( )`) and rejects values that begin
 * with a leading dash (which could be mis-interpreted as a CLI flag in
 * some server-side implementations).
 *
 * Sanitization is opt-in via the `sanitize` prop and is intentionally
 * lightweight — it is a UX guard, not a security boundary. Server-side
 * validation must still be applied independently.
 *
 * @example
 * // Basic usage inside a toolbar
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Search products…"
 *   sanitize={true}
 * />
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move to your JSON locale file when ready (e.g. en.json → "search_input": { … })
const t = {
    /** Default placeholder text when none is provided via props */
    default_placeholder: 'Search...',
};
// ─────────────────────────────────────────────────────────────────────────────

import { Search } from 'lucide-react';

/**
 * Lightweight input sanitizer.
 * - Rejects values that start with `-` (returns empty string).
 * - Strips `< > { } ( )` characters to reduce XSS surface.
 *
 * @param {string} val - Raw value from the input event.
 * @returns {string}   - Sanitized value safe for use as a search query.
 */
const sanitize = (val) => {
    // Reject leading dash — guards against unintended flag-like inputs
    if (val.startsWith('-')) return '';
    // Strip characters commonly used in HTML/script injection
    return val.replace(/[<>{}()]/g, '');
};

/**
 * SearchInput
 *
 * @param {Object}   props
 * @param {string}   props.value                    - Current search string (controlled).
 * @param {Function} props.onChange                 - Called with the new search string on every keystroke.
 * @param {string}   [props.placeholder]            - Input placeholder text. Defaults to `'Search...'`.
 * @param {boolean}  [props.sanitize=false]         - When `true`, strips XSS-prone characters before
 *                                                    calling `onChange`. Defaults to `false`.
 * @returns {JSX.Element}
 */
export default function SearchInput({ value, onChange, placeholder = t.default_placeholder, sanitize: doSanitize = false }) {

    /**
     * Handles the native input change event.
     * Applies sanitization when the `sanitize` prop is enabled,
     * then forwards the clean value to the parent via `onChange`.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    function handleChange(e) {
        const val = doSanitize ? sanitize(e.target.value) : e.target.value;
        onChange(val);
    }

    return (
        <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[var(--accent)] border border-[var(--primary)]/5 focus-within:border-[var(--primary)]/20 transition-all w-40 sm:w-48">
            {/* Decorative search icon — not interactive */}
            <Search size={14} className="text-[var(--primary)]/60 flex-shrink-0" />

            <input
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="bg-transparent text-xs text-[var(--primary)] outline-none border-none focus:ring-0 w-full placeholder:text-[var(--primary)]/40 caret-[var(--primary)] p-0"
            />
        </div>
    );
}