/**
 * @file SyncButton.jsx
 * @module Components/Common/Controls
 *
 * @description
 * Compact icon button that triggers a server-side data sync.
 * Issues a POST request to the provided `endpoint` with Laravel CSRF
 * protection, shows a spinning animation while in-flight, and surfaces
 * success / error feedback via `react-hot-toast`.
 *
 * After a successful sync, the `onSyncSuccess` callback fires after a
 * short delay (2 s) to allow the toast to be seen before the parent
 * refreshes its data (e.g. via React Query's `refetch`).
 *
 * The component reads the CSRF token from the `<meta name="csrf-token">`
 * tag injected by Laravel's Blade layout, so no manual token passing
 * is required from the parent.
 *
 * @example
 * <SyncButton
 *   endpoint="/api/products/sync"
 *   onSyncSuccess={() => queryClient.invalidateQueries(['products'])}
 * />
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move to your JSON locale file when ready (e.g. en.json → "sync_button": { … })
const t = {
    /** Tooltip / title attribute shown on hover */
    button_title: 'Sync Data',
    /** Toast message shown on successful sync */
    toast_success: 'Synced successfully!',
    /** Toast message shown when the sync request fails */
    toast_error: 'Sync failed.',
};
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * SyncButton
 *
 * @param {Object}   props
 * @param {string}   props.endpoint        - Absolute or relative URL for the sync POST request.
 * @param {Function} [props.onSyncSuccess] - Optional callback invoked ~2 s after a successful sync
 *                                           (use to refetch data or invalidate React Query cache).
 * @returns {JSX.Element}
 */
export default function SyncButton({ endpoint, onSyncSuccess }) {
    /** Tracks whether a sync request is currently in-flight */
    const [isSyncing, setIsSyncing] = useState(false);

    /**
     * Inline toast style — mirrors the app's card/border design tokens
     * for consistency with the custom AppToaster component.
     */
    const toastStyle = {
        borderRadius: "12px",
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        fontSize: "14px",
    };

    /**
     * Handles the sync action:
     * 1. Sets the loading state and disables the button.
     * 2. Reads the CSRF token from the Blade-injected meta tag.
     * 3. POSTs to the endpoint with JSON + CSRF headers.
     * 4. Parses the response; throws if `data.success` is false or HTTP is non-OK.
     * 5. Shows a success toast and schedules the `onSyncSuccess` callback.
     * 6. Shows an error toast on any failure.
     * 7. Always resets the loading state in `finally`.
     */
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // Read the CSRF token injected by Laravel's Blade layout
            const token = document.querySelector('meta[name="csrf-token"]')?.content;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            const data = await res.json();

            // Treat both HTTP errors and API-level failures as exceptions
            if (!res.ok || !data.success) throw new Error('Sync failed');

            toast.success(t.toast_success, { style: toastStyle });

            // Delay the success callback slightly so the toast is visible first
            if (onSyncSuccess) setTimeout(() => onSyncSuccess(), 2000);

        } catch {
            toast.error(t.toast_error, { style: toastStyle });
        } finally {
            // Always re-enable the button regardless of outcome
            setIsSyncing(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing}
            title={t.button_title}
            aria-label={t.button_title}
            className="h-9 w-9 rounded-xl bg-[var(--accent)] text-[var(--primary)] hover:opacity-80 transition-opacity flex items-center justify-center border border-[var(--primary)]/5 flex-shrink-0"
        >
            {/* Icon spins while the request is in-flight */}
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
        </button>
    );
}