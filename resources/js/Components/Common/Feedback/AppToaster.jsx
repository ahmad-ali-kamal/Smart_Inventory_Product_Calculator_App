/**
 * @file AppToaster.jsx
 * @module Components/Common/Feedback
 *
 * @description
 * Global toast notification system.
 * Exports two pieces:
 *
 *  - **CustomToast**  — individual toast renderer used as the render prop
 *                       for `react-hot-toast`'s <Toaster>. Supports three
 *                       variants: success, error, and loading.
 *  - **AppToaster**   — singleton container. Place it ONCE inside AppLayout
 *                       (not per-page) so toasts are globally available and
 *                       never duplicated.
 *
 * Usage elsewhere in the app:
 * @example
 * import toast from 'react-hot-toast';
 * toast.success('Settings saved.');
 * toast.error('Failed to sync.');
 * toast.loading('Syncing…');
 */

import { Toaster } from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────────────────────
// CustomToast — individual toast renderer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CustomToast
 *
 * Renders a single toast notification. Used as the render prop for <Toaster>.
 * Framer-style CSS keyframe animations are injected inline via a <style> tag
 * so no external stylesheet is required.
 *
 * @param {Object} props
 * @param {import('react-hot-toast').Toast} props.toast - The toast object
 *   provided by react-hot-toast, containing `type`, `visible`, `message`,
 *   and `duration`.
 * @returns {JSX.Element}
 */
function CustomToast({ toast: t_toast }) {
    const { t } = useTranslation('shared');
    // Derive variant flags from the toast type for clean conditional rendering
    const isSuccess = t_toast.type === 'success';
    const isError   = t_toast.type === 'error';
    const isLoading = t_toast.type === 'loading';

    return (
        <div
            style={{
                // Slide in on mount, slide out on dismiss
                animation: t_toast.visible
                    ? 'toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                    : 'toastSlideOut 0.25s ease-in forwards',
            }}
            className="
                flex items-start gap-3 w-full max-w-sm
                bg-[var(--card)] border border-[var(--border)]
                rounded-2xl px-4 py-3.5
                shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]
                backdrop-blur-sm
            "
        >
            {/* ── Icon area — colored badge matching the toast variant ── */}
            <div className="flex-shrink-0 mt-0.5">
                {isSuccess && (
                    <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-[var(--primary)]" />
                    </div>
                )}
                {isError && (
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <XCircle size={16} className="text-red-500" />
                    </div>
                )}
                {isLoading && (
                    <div className="w-8 h-8 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                        <Loader2 size={16} className="text-[var(--muted-foreground)] animate-spin" />
                    </div>
                )}
            </div>

            {/* ── Body: small label + main message ── */}
            <div className="flex-1 min-w-0">
                {/* Variant label (SUCCESS / ERROR / PROCESSING) */}
                <p className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-0.5">
                    {isSuccess
                        ? t('toast.toast_label_success')
                        : isError
                            ? t('toast.toast_label_error')
                            : t('toast.toast_label_loading')
                    }
                </p>

                {/* Main toast message — guarded against non-string values */}
                <p className="text-sm font-medium text-[var(--foreground)] leading-snug">
                    {typeof t_toast.message === 'string' ? t_toast.message : t('toast.toast_fallback_message')}
                </p>
            </div>

            {/*
             * ── Progress bar ──
             * Only shown for non-loading toasts. Shrinks from 100% → 0% over
             * the toast duration, giving the user a visual countdown.
             */}
            {!isLoading && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl overflow-hidden">
                    <div
                        className={`h-full ${isSuccess ? 'bg-[var(--primary)]' : 'bg-red-500'}`}
                        style={{
                            animation: t_toast.visible
                                ? `toastProgress ${t_toast.duration || 4000}ms linear forwards`
                                : 'none',
                        }}
                    />
                </div>
            )}

            {/* Scoped keyframe definitions — avoids polluting the global stylesheet */}
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(20px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0)    scale(1);    }
                }
                @keyframes toastSlideOut {
                    from { opacity: 1; transform: translateX(0)    scale(1);    }
                    to   { opacity: 0; transform: translateX(20px) scale(0.95); }
                }
                @keyframes toastProgress {
                    from { width: 100%; }
                    to   { width: 0%;   }
                }
            `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppToaster — singleton container, placed once in AppLayout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AppToaster
 *
 * Renders the global `react-hot-toast` container with  custom
 * toast renderer. Mount this ONCE in your root layout component (AppLayout),
 * not inside individual pages, to ensure a single toast stack exists.
 *
 * @returns {JSX.Element}
 */
export default function AppToaster() {
    return (
        <Toaster
            position="bottom-right"
            gutter={12}
            toastOptions={{
                duration: 4000,
                style: {
                    // Strip react-hot-toast's default card styles; CustomToast
                    // provides all visual styling via Tailwind + CSS variables.
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                    maxWidth: '380px',
                },
            }}
        >
            {/* Delegate rendering of each toast to CustomToast */}
            {(t_instance) => <CustomToast toast={t_instance} />}
        </Toaster>
    );
}