// Components/Settings/LivePreviewCard.jsx
//
// Single Responsibility: visualise the live calculation preview.
// Receives the pre-computed `preview` object (or null) — does no math itself.
//
import { Calculator, AlertCircle } from 'lucide-react';
import { PREVIEW_AREA } from '../../../constants/calculatorSettings';

/**
 * @param {{ base: number, withWaste: number, extraUnits: number } | null} preview
 */
export default function LivePreviewCard({ preview }) {
    return (
        <div className="bg-[var(--primary)] p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">

            {/* Decorative background icon */}
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Calculator size={120} />
            </div>

            <div className="relative z-10">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-6">
                    Live Preview — {PREVIEW_AREA} m² Area
                </h3>

                {preview ? (
                    <div className="space-y-8">
                        {/* Primary stat */}
                        <div>
                            <p className="text-sm opacity-80 mb-1">
                                Customer needs for {PREVIEW_AREA} m²:
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black">{preview.withWaste}</span>
                                <span className="text-xl font-bold opacity-60">Units</span>
                            </div>
                        </div>

                        {/* Secondary stats */}
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
                        <p className="text-sm text-center">Enter valid values to see preview</p>
                    </div>
                )}
            </div>

            <p className="relative z-10 text-[10px] opacity-50 mt-8 leading-relaxed font-medium">
                * This simulation uses the actual calculator engine to show how quantities are
                computed for customers.
            </p>
        </div>
    );
}