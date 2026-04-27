import { useState } from 'react';

const NAV_ITEMS = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'products', label: 'Products' },
    { id: 'settings', label: 'Settings' },
];

export default function Navbar({ active = 'dashboard', onNavigate }) {
    const [current, setCurrent] = useState(active);

    const handleClick = (id) => {
        setCurrent(id);
        onNavigate?.(id);
    };

    return (
        <header className="w-full bg-[#f8f8fb] sticky top-0 z-30 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-900 flex items-center justify-center shadow-sm">
                        <div className="grid grid-cols-2 gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                        </div>
                    </div>
                    <p className="text-[1.05rem] font-semibold tracking-tight">
                        <span className="text-neutral-400">Merchant</span>
                        <span className="text-neutral-900">Tools</span>
                    </p>
                </div>

                {/* Pill nav */}
                <nav className="hidden md:flex items-center gap-1 bg-white/70 border border-neutral-200/70 rounded-full px-1.5 py-1.5 shadow-sm">
                    {NAV_ITEMS.map((item) => {
                        const isActive = current === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleClick(item.id)}
                                className={[
                                    'px-5 py-2 text-sm font-medium rounded-full transition-all duration-200',
                                    isActive
                                        ? 'bg-neutral-900 text-white shadow-md'
                                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-white',
                                ].join(' ')}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Right icons */}
                <div className="flex items-center gap-2">
                    <IconButton aria-label="Search">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                        </svg>
                    </IconButton>
                    <IconButton aria-label="Notifications">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                            <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7Z" strokeLinejoin="round" />
                            <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
                        </svg>
                    </IconButton>
                    <button
                        aria-label="Profile"
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white text-xs font-semibold flex items-center justify-center shadow-md hover:shadow-lg hover:scale-[1.04] transition-all"
                    >
                        MT
                    </button>
                </div>
            </div>
        </header>
    );
}

function IconButton({ children, ...rest }) {
    return (
        <button
            {...rest}
            className="w-10 h-10 rounded-full bg-white/70 border border-neutral-200/70 text-neutral-600 flex items-center justify-center hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all"
        >
            {children}
        </button>
    );
}
