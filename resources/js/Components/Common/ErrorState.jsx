// resources/js/Components/Common/ErrorState.jsx
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-in fade-in duration-500">
            
            {/* الأيقونة: تستخدم نفس ستايل اللودينق (خلفية muted ناعمة) */}
            <div className="w-20 h-20 bg-[var(--muted)] bg-opacity-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-[var(--border)]">
                <AlertCircle className="w-10 h-10 text-[var(--muted-foreground)] opacity-60" strokeWidth={1.5} />
            </div>
            
            {/* النص الإنجليزي الأصلي */}
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Unable to Load Products
            </h3>
            
            <p className="text-[var(--muted-foreground)] max-w-sm mb-10 text-sm leading-relaxed">
                {message || "We're having trouble connecting to your store's catalog. Please check your connection and try again."}
            </p>
            
            {/* الزر: يستخدم نفس روح تصميم الداشبورد (أسود في اللايت / فاتح في الدارك) */}
            <button 
                onClick={onRetry}
                className="flex items-center gap-2 px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-black/5"
            >
                <RefreshCw className="w-4 h-4" />
                Try Again
            </button>
        </div>
    );
}