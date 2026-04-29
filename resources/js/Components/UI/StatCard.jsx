// resources/js/Components/UI/StatCard.jsx

export default function StatCard({ title, value, icon: Icon, variant = 'default' }) {
    return (
        <div className="bg-[var(--card)] p-8 rounded-[2rem] border border-[var(--border)]">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    {title}
                </span>
                {/* تأكدي من استدعائها كـ Component بـ حرف كبير Icon */}
                {Icon && <Icon className="w-5 h-5 text-[var(--primary)]" />}
            </div>
            
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[var(--foreground)]">
                    {value}
                </span>
            </div>
        </div>
    );
}