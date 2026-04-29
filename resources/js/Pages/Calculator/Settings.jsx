// resources/js/Pages/Calculator/Settings.jsx
import { useState, useMemo } from 'react';
import Layout from '../../Components/Layout';
import { useProducts } from '../../Context/ProductsContext';
import { SlidersHorizontal, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Settings() {
    const { calcRules, updateCalcRules } = useProducts();
    
    const [coverage, setCoverage] = useState(calcRules?.coverage || 8);
    const [waste, setWaste] = useState(calcRules?.waste || 10);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        let newErrors = {};
        if (!coverage || coverage <= 0) newErrors.coverage = "Please enter a value greater than 0";
        if (waste < 0 || waste > 100) newErrors.waste = "Percentage must be between 0 and 100";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const preview = useMemo(() => {
        const area = 25; 
        const base = Math.ceil(area / (parseFloat(coverage) || 1));
        const withWaste = Math.ceil(base * (1 + (parseFloat(waste) || 0) / 100));
        return { base, withWaste };
    }, [coverage, waste]);

    const handleSave = () => {
        if (validate()) {
            updateCalcRules({ 
                coverage: parseFloat(coverage), 
                waste: parseFloat(waste) 
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
                
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
                        <SlidersHorizontal size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-[var(--foreground)]">Calculation Settings</h1>
                        <p className="text-sm text-[var(--muted-foreground)] uppercase tracking-widest font-medium">Manage how your products are calculated</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Input Section - Fully Dark Mode Compatible */}
                    <div className="bg-[var(--card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 text-[var(--foreground)]">
                        <div className="space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Area per Unit (m²)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={coverage}
                                    onChange={(e) => { setCoverage(e.target.value); setErrors({}); }}
                                    className={`w-full bg-[var(--muted)] border ${errors.coverage ? 'border-red-400' : 'border-[var(--border)]'} rounded-2xl p-4 text-lg font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all text-[var(--foreground)] placeholder-[var(--muted-foreground)]`}
                                    placeholder="e.g. 8.0"
                                />
                                {errors.coverage && <p className="text-red-500 text-[10px] mt-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.coverage}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Extra Waste (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={waste}
                                    onChange={(e) => { setWaste(e.target.value); setErrors({}); }}
                                    className={`w-full bg-[var(--muted)] border ${errors.waste ? 'border-red-400' : 'border-[var(--border)]'} rounded-2xl p-4 text-lg font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all text-[var(--foreground)] placeholder-[var(--muted-foreground)]`}
                                    placeholder="e.g. 10"
                                />
                                {errors.waste && <p className="text-red-500 text-[10px] mt-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.waste}</p>}
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saved}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
                                saved 
                                ? 'bg-emerald-700 text-white' 
                                : 'bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 shadow-lg shadow-indigo-500/20'
                            }`}
                        >
                            {saved ? (
                                <span className="flex items-center justify-center gap-2"><CheckCircle2 size={18}/> Saved Successfully</span>
                            ) : 'Apply Settings'}
                        </button>
                    </div>

                    {/* Preview Section - Modern Logic View */}
                    <div className="bg-gradient-to-br from-[var(--primary)] to-[#7e79b8] p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Calculator size={120} />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-6">How it works</h3>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-sm opacity-80 mb-1">For a 25m² area, the customer will need:</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black">{preview.withWaste}</span>
                                        <span className="text-xl font-bold opacity-60">Units</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[10px] font-black uppercase opacity-60">Actual Quantity</p>
                                        <p className="text-xl font-bold">{preview.base} <span className="text-[10px]">Units</span></p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[10px] font-black uppercase opacity-60">Extra for Waste</p>
                                        <p className="text-xl font-bold">+{preview.withWaste - preview.base} <span className="text-[10px]">Units</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="relative z-10 text-[10px] opacity-50 mt-8 leading-relaxed font-medium">
                            * This example shows how the system will calculate quantities for your customers.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}