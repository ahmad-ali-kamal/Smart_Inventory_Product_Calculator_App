// resources/js/Components/Common/SetupBanner.jsx
import { Settings2, ArrowRight } from 'lucide-react';

export default function SetupBanner({
    href        = '/harees/settings',
    description = 'Set up your expiry thresholds first so products and batches can be tracked.',
}) {
    return (
        <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4"
            style={{ background: 'var(--accent)', border: '1px solid var(--border)' }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                    <Settings2 size={15} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                    <p className="text-[12px] font-black" style={{ color: 'var(--foreground)' }}>
                        Settings not configured
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {description}
                    </p>
                </div>
            </div>
            <a
                href={href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide shrink-0 transition-opacity hover:opacity-80"
                style={{ background: 'var(--primary)', color: 'white' }}
            >
                Settings
                <ArrowRight size={11} />
            </a>
        </div>
    );
}