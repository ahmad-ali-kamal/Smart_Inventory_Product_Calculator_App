import { Search } from 'lucide-react';

const sanitize = (val) => {
    if (val.startsWith('-')) return '';
    return val.replace(/[<>{}()]/g, '');
};

/**
 * Props:
 *   value       string
 *   onChange    (val: string) => void
 *   placeholder string  (default: "Search...")
 *   sanitize    boolean (default: false) — enable XSS sanitization
 */
export default function SearchInput({ value, onChange, placeholder = 'Search...', sanitize: doSanitize = false }) {
    function handleChange(e) {
        const val = doSanitize ? sanitize(e.target.value) : e.target.value;
        onChange(val);
    }

    return (
        <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[var(--accent)] border border-[var(--primary)]/5 focus-within:border-[var(--primary)]/20 transition-all w-40 sm:w-48">
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