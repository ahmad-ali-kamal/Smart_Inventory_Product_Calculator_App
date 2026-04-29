import React, { useState } from 'react';
import { X, CalendarPlus, Trash2, PlusCircle, CheckCircle } from 'lucide-react';

export default function ExpiryModal({ product, onClose, onSave }) {
    const [selection, setSelection] = useState(null); // 'yes' or 'no'
    const [batches, setBatches] = useState([{ id: Date.now(), qty: 1, date: "" }]);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        setIsSaved(true);
        setTimeout(() => {
            onSave(product.id);
            onClose();
        }, 1500);
    };

    return (
        // التعديل: التوسيط في منتصف الصفحة تماماً
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-[500px] bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                        <CalendarPlus size={20} />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">Inventory Expiry Setup</h3>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"><X size={16} /></button>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm font-bold text-[var(--foreground)] text-center">Do all quantities have the same expiry date?</p>
                    
                    <div className="flex gap-3">
                        <button onClick={() => setSelection('yes')} className={`flex-1 py-3 rounded-2xl border text-xs font-bold transition-all ${selection === 'yes' ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--primary)]' : 'border-[var(--border)]'}`}>Yes</button>
                        <button onClick={() => setSelection('no')} className={`flex-1 py-3 rounded-2xl border text-xs font-bold transition-all ${selection === 'no' ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--primary)]' : 'border-[var(--border)]'}`}>No</button>
                    </div>

                    {selection === 'yes' && (
                        <div className="p-5 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/20 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[var(--primary)]">SINGLE BATCH</span>
                                <Trash2 size={14} className="text-red-400 cursor-pointer" />
                            </div>
                            <input type="date" className="w-full p-3 rounded-xl border border-[var(--border)] bg-white text-sm outline-none focus:border-[var(--primary)]" />
                        </div>
                    )}

                    {selection === 'no' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[var(--primary)]">MULTIPLE BATCHES</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setBatches([])} className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">Delete All</button>
                                    <button onClick={() => setBatches([...batches, { id: Date.now() }])} className="text-[10px] font-bold text-[var(--primary)] bg-[var(--secondary)] px-2 py-1 rounded-lg flex items-center gap-1"><PlusCircle size={10}/> Add Batch</button>
                                </div>
                            </div>
                            {batches.map((batch, idx) => (
                                <div key={batch.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                                    <div className="flex justify-between items-center text-left">
                                        <span className="text-[11px] font-bold">Batch {idx + 1}</span>
                                        <Trash2 size={13} onClick={() => setBatches(batches.filter(b => b.id !== batch.id))} className="text-red-400 cursor-pointer" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="number" placeholder="Qty" className="p-2 border rounded-lg text-xs" />
                                        <input type="date" className="p-2 border rounded-lg text-xs" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-[var(--border)]">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaved}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isSaved 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                            : 'bg-[var(--primary)] text-white hover:opacity-90'
                        }`}
                    >
                        {isSaved ? <><CheckCircle size={16} /> Saved Successfully</> : "Save Expiry Information"}
                    </button>
                </div>
            </div>
        </div>
    );
}