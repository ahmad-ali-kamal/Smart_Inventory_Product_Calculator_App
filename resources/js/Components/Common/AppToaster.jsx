// Components/Common/AppToaster.jsx
//
// Single Responsibility: render the global toast container + individual toasts.
// Moved out of Settings so it can be placed once in AppLayout and shared
// across every page — no more duplicating <Toaster> in each page.
//
import { Toaster } from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// CustomToast — individual toast renderer
// ---------------------------------------------------------------------------
function CustomToast({ toast: t }) {
    const isSuccess = t.type === 'success';
    const isError   = t.type === 'error';
    const isLoading = t.type === 'loading';

    return (
        <div
            style={{
                animation: t.visible
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
            {/* Icon */}
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

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-0.5">
                    {isSuccess ? 'Success' : isError ? 'Error' : 'Processing'}
                </p>
                <p className="text-sm font-medium text-[var(--foreground)] leading-snug">
                    {typeof t.message === 'string' ? t.message : 'Operation complete'}
                </p>
            </div>

            {/* Progress bar */}
            {!isLoading && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl overflow-hidden">
                    <div
                        className={`h-full ${isSuccess ? 'bg-[var(--primary)]' : 'bg-red-500'}`}
                        style={{
                            animation: t.visible
                                ? `toastProgress ${t.duration || 4000}ms linear forwards`
                                : 'none',
                        }}
                    />
                </div>
            )}

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

// ---------------------------------------------------------------------------
// AppToaster — place once in AppLayout, not per-page
// ---------------------------------------------------------------------------
export default function AppToaster() {
    return (
        <Toaster
            position="bottom-right"
            gutter={12}
            toastOptions={{
                duration: 4000,
                style: {
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                    maxWidth: '380px',
                },
            }}
        >
            {(t) => <CustomToast toast={t} />}
        </Toaster>
    );
}