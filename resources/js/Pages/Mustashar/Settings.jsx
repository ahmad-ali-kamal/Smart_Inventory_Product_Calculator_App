// resources/js/Pages/Calculator/Settings.jsx
import { useState, useMemo, useEffect } from 'react';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import Layout from '../../Components/Layout';
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import { useCalculatorSettings, useUpdateCalculatorSettings } from '../../Hooks/useProducts';
import { SlidersHorizontal, Calculator, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { FormSkeleton } from '../../Components/Common/FormSkeleton';
import ErrorState from '../../Components/Common/ErrorState';

// ---------------------------------------------------------------------------
// Validation constants — Synced with backend logic
// ---------------------------------------------------------------------------
const COVERAGE_MIN = 0.01;
const COVERAGE_MAX = 200;
const WASTE_MIN = 0;
const WASTE_MAX = 50;
const PREVIEW_AREA = 25;

// Standard rounding helper for calculation consistency
function roundSafe(n, decimals) {
    const d = Math.max(0, decimals | 0);
    return Number(Math.round(+(n + Number.EPSILON) + 'e' + d) + 'e-' + d);
}

// ---------------------------------------------------------------------------
// computePreview — Matches calculation engine in the snippet
// ---------------------------------------------------------------------------
function computePreview({ length, width, wastePct, coveragePerUnit, unitPrice }) {
    if (!Number.isFinite(coveragePerUnit) || coveragePerUnit <= 0) {
        return { area: 0, units: 0, finalPrice: 0 };
    }

    const safeLength = Math.max(0, length);
    const safeWidth  = Math.max(0, width);
    const safeWaste  = Math.max(0, wastePct);

    const area          = roundSafe(safeLength * safeWidth, 4);
    const wasteFactor   = roundSafe(1 + safeWaste / 100, 6);
    const areaWithWaste = roundSafe(area * wasteFactor, 4);
    const rawUnits      = roundSafe(areaWithWaste / coveragePerUnit, 6);

    const units = Math.ceil(rawUnits);
    const unitPriceSafe = (Number.isFinite(unitPrice) && unitPrice > 0) ? unitPrice : 0;
    const finalPrice    = roundSafe(units * unitPriceSafe, 2);

    return { area, units, finalPrice };
}

// ---------------------------------------------------------------------------
// validateFields — Field-level integrity checks
// ---------------------------------------------------------------------------
function validateFields(coverage, waste) {
    const errors = {};

    const coverageNum = parseFloat(coverage);
    if (coverage === '' || isNaN(coverageNum)) {
        errors.coverage = 'Enter a valid coverage value';
    } else if (coverageNum < COVERAGE_MIN) {
        errors.coverage = `Coverage must be at least ${COVERAGE_MIN} m²`;
    } else if (coverageNum > COVERAGE_MAX) {
        errors.coverage = `Coverage cannot exceed ${COVERAGE_MAX} m² per unit`;
    }

    const wasteNum = parseFloat(waste);
    if (waste === '' || isNaN(wasteNum)) {
        errors.waste = 'Enter a valid waste percentage';
    } else if (wasteNum < WASTE_MIN) {
        errors.waste = 'Waste percentage cannot be negative';
    } else if (wasteNum > WASTE_MAX) {
        errors.waste = `Waste percentage cannot exceed ${WASTE_MAX}%`;
    }

    return errors;
}

// ---------------------------------------------------------------------------
// CustomToaster — Styled to match SaaS dashboard (light + dark adaptive)
// ---------------------------------------------------------------------------
function CustomToaster() {
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

// ---------------------------------------------------------------------------
// CustomToast — Individual toast renderer
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
            className={`
                flex items-start gap-3 w-full max-w-sm
                bg-[var(--card)] border border-[var(--border)]
                rounded-2xl px-4 py-3.5
                shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]
                backdrop-blur-sm
            `}
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
// Settings Page — Al-Mustashar / Harees Calculator Settings
// ---------------------------------------------------------------------------
export default function Settings() {
    useMustasharGuard();

    const { data: settings, isLoading, isError, error, refetch } = useCalculatorSettings();
    const updateSettings = useUpdateCalculatorSettings();

    const [coverage, setCoverage] = useState('8');
    const [waste,    setWaste]    = useState('10');
    const [errors,   setErrors]   = useState({});

    // Sync state with server data
    useEffect(() => {
        if (settings) {
            setCoverage(String(settings.coverage ?? 8));
            setWaste(String(settings.waste ?? 10));
        }
    }, [settings]);

    // ---------------------------------------------------------------------------
    // Preview — Live simulation based on current inputs
    // ---------------------------------------------------------------------------
    const preview = useMemo(() => {
        const coverageNum = parseFloat(coverage);
        const wasteNum    = parseFloat(waste);

        if (
            isNaN(coverageNum) || coverageNum < COVERAGE_MIN || coverageNum > COVERAGE_MAX ||
            isNaN(wasteNum)    || wasteNum    < WASTE_MIN    || wasteNum    > WASTE_MAX
        ) {
            return null;
        }

        const raw = computePreview({
            length: 5,
            width: 5,
            wastePct: wasteNum,
            coveragePerUnit: coverageNum,
            unitPrice: 0,
        });

        const base       = Math.ceil(PREVIEW_AREA / coverageNum);
        const withWaste  = raw.units;
        const extraUnits = Math.max(0, withWaste - base);

        return { base, withWaste, extraUnits };
    }, [coverage, waste]);

    const handleCoverageChange = (e) => {
        setCoverage(e.target.value);
        if (errors.coverage) setErrors((prev) => ({ ...prev, coverage: undefined }));
    };

    const handleWasteChange = (e) => {
        setWaste(e.target.value);
        if (errors.waste) setErrors((prev) => ({ ...prev, waste: undefined }));
    };

    // ---------------------------------------------------------------------------
    // handleSave — Validates, submits, and triggers styled toast notifications
    // ---------------------------------------------------------------------------
    async function handleSave() {
        const fieldErrors = validateFields(coverage, waste);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            // Show a validation warning toast
            toast.error('Please fix the highlighted fields before saving.');
            return;
        }
        setErrors({});

        const coverageNum = parseFloat(coverage);
        const wasteNum    = parseFloat(waste);

        try {
            await updateSettings.mutateAsync({ coverage: coverageNum, waste: wasteNum });
            toast.success('Settings saved successfully.');
        } catch (err) {
            // Extract the most specific server error message available
            const serverMsg =
                err?.response?.data?.message ||
                err?.response?.data?.errors?.coverage_per_unit?.[0] ||
                err?.response?.data?.errors?.waste_percentage?.[0] ||
                'Failed to save settings. Please try again.';
            toast.error(serverMsg);
        }
    }

    // ---------------------------------------------------------------------------
    // Loading / Error states
    // ---------------------------------------------------------------------------
    if (isLoading) {
        return (
            <Layout>
                <div className="p-8 max-w-4xl mx-auto">
                    <FormSkeleton />
                </div>
            </Layout>
        );
    }

    if (isError) {
        return (
            <Layout>
                <ErrorState
                    message={error?.message || 'Unable to load settings'}
                    onRetry={refetch}
                />
            </Layout>
        );
    }

    const isSaving = updateSettings.isPending;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">

                {/* ── Page Header ── */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
                        <SlidersHorizontal size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-[var(--foreground)]">
                            Calculator Settings
                        </h1>
                        <p className="text-sm text-[var(--muted-foreground)] uppercase tracking-widest font-medium">
                            Configure calculation parameters for products
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ── Input Card ── */}
                    <div className="bg-[var(--card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 text-[var(--foreground)]">

                        {/* Coverage field */}
                        <div className="space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                                Unit Coverage (m²)
                            </label>
                            <p className="text-[11px] text-[var(--muted-foreground)] -mt-2">
                                Area covered by one unit — between {COVERAGE_MIN} and {COVERAGE_MAX} m²
                            </p>
                            <div>
                                <input
                                    type="number"
                                    value={coverage}
                                    min={COVERAGE_MIN}
                                    max={COVERAGE_MAX}
                                    step="0.01"
                                    onChange={handleCoverageChange}
                                    className={`w-full bg-[var(--muted)] border ${
                                        errors.coverage
                                            ? 'border-red-400 focus:ring-red-400/30'
                                            : 'border-[var(--border)] focus:ring-[var(--primary)]'
                                    } rounded-2xl p-4 text-lg font-bold focus:ring-2 outline-none transition-all text-[var(--foreground)] placeholder-[var(--muted-foreground)]`}
                                    placeholder="e.g., 2.56"
                                />
                                {errors.coverage && (
                                    <p className="text-red-500 text-[10px] mt-2 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errors.coverage}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Waste field */}
                        <div className="space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                                Waste Percentage (%)
                            </label>
                            <p className="text-[11px] text-[var(--muted-foreground)] -mt-2">
                                Extra safety margin — from {WASTE_MIN}% up to {WASTE_MAX}%
                            </p>
                            <div>
                                <input
                                    type="number"
                                    value={waste}
                                    min={WASTE_MIN}
                                    max={WASTE_MAX}
                                    step="0.1"
                                    onChange={handleWasteChange}
                                    className={`w-full bg-[var(--muted)] border ${
                                        errors.waste
                                            ? 'border-red-400 focus:ring-red-400/30'
                                            : 'border-[var(--border)] focus:ring-[var(--primary)]'
                                    } rounded-2xl p-4 text-lg font-bold focus:ring-2 outline-none transition-all text-[var(--foreground)] placeholder-[var(--muted-foreground)]`}
                                    placeholder="e.g., 10"
                                />
                                {errors.waste && (
                                    <p className="text-red-500 text-[10px] mt-2 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errors.waste}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Save button — with loading state */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                                isSaving
                                    ? 'bg-[var(--primary)] text-white opacity-70 cursor-not-allowed'
                                    : 'bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 shadow-indigo-500/20'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save All Settings'
                            )}
                        </button>
                    </div>

                    {/* ── Live Preview Card ── */}
                    <div className="bg-[var(--primary)] p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Calculator size={120} />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-6">
                                Live Preview — {PREVIEW_AREA} m² Area
                            </h3>

                            {preview ? (
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-sm opacity-80 mb-1">
                                            Customer needs for {PREVIEW_AREA} m²:
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-black">{preview.withWaste}</span>
                                            <span className="text-xl font-bold opacity-60">Units</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                                        <div className="bg-white/10 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase opacity-60">Base Quantity</p>
                                            <p className="text-xl font-bold">
                                                {preview.base} <span className="text-[10px]">units</span>
                                            </p>
                                        </div>
                                        <div className="bg-white/10 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase opacity-60">Waste Margin</p>
                                            <p className="text-xl font-bold">
                                                +{preview.extraUnits} <span className="text-[10px]">units</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 opacity-60 gap-3">
                                    <AlertCircle size={32} />
                                    <p className="text-sm text-center">
                                        Enter valid values to see preview
                                    </p>
                                </div>
                            )}
                        </div>

                        <p className="relative z-10 text-[10px] opacity-50 mt-8 leading-relaxed font-medium">
                            * This simulation shows how quantities are calculated for customers using the actual calculator engine.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}