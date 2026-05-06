const VARIANTS = {
    purple: {
        topBar: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-400',
        iconWrap: 'bg-violet-100 text-violet-600',
        number: 'text-violet-600',
        ring: 'bg-violet-100/60',
    },
    dark: {
        topBar: 'bg-gradient-to-r from-neutral-800 to-neutral-900',
        iconWrap: 'bg-neutral-100 text-neutral-700',
        number: 'text-neutral-900',
        ring: 'bg-neutral-100',
    },
    soft: {
        topBar: 'bg-gradient-to-r from-purple-200 via-violet-200 to-fuchsia-200',
        iconWrap: 'bg-violet-50 text-violet-500',
        number: 'text-neutral-900',
        ring: 'bg-violet-50',
    },
};

export default function StatCard({
    variant = 'purple',
    icon,
    label,
    sublabel,
    children,
}) {
    const v = VARIANTS[variant] ?? VARIANTS.purple;

    return (
        <div className="relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-neutral-100">

            <div className={['absolute inset-x-0 top-0 h-[3px]', v.topBar].join(' ')} />

            <div className={[
                'pointer-events-none absolute -bottom-12 -right-12 w-40 h-40 rounded-full',
                v.ring,
                'opacity-60',
            ].join(' ')} />

            <div className="relative p-6">
                <div className="flex items-center gap-4 mb-5">
                    <div className={[
                        'w-12 h-12 rounded-xl flex items-center justify-center text-lg',
                        v.iconWrap,
                    ].join(' ')}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                            {label}
                        </p>
                        <p className="text-sm text-neutral-700 mt-0.5">{sublabel}</p>
                    </div>
                </div>

                <div className={['text-5xl font-light tracking-tight', VARIANTS[variant].number].join(' ')}>
                    {children}
                </div>
            </div>
        </div>
    );
}
