// resources/js/Pages/Calculator/Settings.jsx
import { useState } from 'react';
import Layout from '../../Components/Layout';
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import Card from '../../Components/UI/Card';
import { useProducts } from '../../Context/ProductsContext';
import { SlidersHorizontal } from 'lucide-react';

function calcUnits(area, coverage, waste) {
    const base      = Math.ceil(area / coverage);
    const withWaste = Math.ceil(base * (1 + waste / 100));
    return { base, withWaste };
}

export default function Settings() {
    useMustasharGuard();
    const { calcRules, updateCalcRules } = useProducts();
    const [coverage, setCoverage] = useState(calcRules.coverage);
    const [waste, setWaste]       = useState(calcRules.waste);
    const [saved, setSaved]       = useState(false);

    const { base, withWaste } = calcUnits(25, coverage || 8, waste || 9);

    const handleSave = () => {
        updateCalcRules({ coverage: parseFloat(coverage), waste: parseFloat(waste) });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <Card className="overflow-hidden">
                    <div className="px-8 pt-8 pb-6 border-b border-[var(--border)] flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--foreground)]">Calculation Rules</h2>
                            <p className="text-sm text-[var(--muted-foreground)]">Configure the engine that powers your smart calculator.</p>
                        </div>
                    </div>

                    <div className="px-8 py-6 space-y-6">
                        <div className="bg-[var(--muted)] rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-[var(--foreground)]">How it works</span>
                            </div>
                            <p className="text-sm text-[var(--muted-foreground)]">The formula uses coverage to calculate units, then applies the waste margin on top.</p>
                            <code className="text-xs bg-[var(--background)] border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--foreground)] font-mono block w-fit mt-2">
                                units = ⌈area ÷ coverage⌉ × (1 + waste%)
                            </code>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]">Coverage per unit (m²)</label>
                            <div className="relative">
                                <input
                                    type="number" value={coverage} min="0.01" step="0.01"
                                    onChange={(e) => setCoverage(e.target.value)}
                                    className="w-full px-4 py-3 pr-16 bg-[var(--input-background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--muted)] text-xs text-[var(--muted-foreground)] font-medium">sqm</div>
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)]">The area in square metres that one unit covers.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]">Waste percentage (%)</label>
                            <div className="relative">
                                <input
                                    type="number" value={waste} min="0" max="100" step="0.01"
                                    onChange={(e) => setWaste(e.target.value)}
                                    className="w-full px-4 py-3 pr-16 bg-[var(--input-background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--muted)] text-xs text-[var(--muted-foreground)] font-medium">%</div>
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)]">Extra units added to account for off-cuts and breakage.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Live Preview</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)] font-medium">25 m² example</span>
                            </div>
                            <div className="bg-[var(--muted)] rounded-xl p-5">
                                <div className="flex items-center justify-around">
                                    <div className="text-center">
                                        <p className="text-xs text-[var(--muted-foreground)] mb-1">Input Area</p>
                                        <p className="text-xl font-semibold text-[var(--foreground)]">25 m²</p>
                                    </div>
                                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <div className="text-center">
                                        <p className="text-xs text-[var(--muted-foreground)] mb-1">Base Units</p>
                                        <p className="text-xl font-semibold text-[var(--foreground)]">{base}</p>
                                    </div>
                                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <div className="text-center">
                                        <p className="text-xs text-[var(--muted-foreground)] mb-1">With Waste</p>
                                        <p className="text-2xl font-bold text-[var(--primary)]">{withWaste} units</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-medium transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-[var(--primary)] text-white hover:opacity-90'}`}
                            >
                                {saved ? '✓ Saved!' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => { setCoverage(8.0); setWaste(9.0); }}
                                className="px-5 py-3.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="px-8 py-3 border-t border-[var(--border)] bg-[var(--muted)]">
                        <p className="text-xs text-center text-[var(--muted-foreground)]">Changes apply to all activated products immediately.</p>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}