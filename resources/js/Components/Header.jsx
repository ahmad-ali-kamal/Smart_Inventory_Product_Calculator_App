import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTheme } from '../Context/ThemeContext';
import { Sun, Moon, User, LayoutGrid, ChevronDown, Globe, LogOut } from 'lucide-react';

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const { url } = usePage();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const navItems = [
        { label: 'Instructions', href: '/instructions' },
        { label: 'Dashboard',    href: '/dashboard' },
        { label: 'Products',     href: '/products' },
        { label: 'Settings',     href: '/settings' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)] transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

                {/* 1. Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-sm">
                        <LayoutGrid className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-[var(--foreground)] text-base tracking-tight">Quantix</span>
                </div>

                {/* 2. Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = url.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                                    isActive
                                        ? 'bg-[var(--primary)] text-white font-medium shadow-sm'
                                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* 3. Actions Area */}
                <div className="flex items-center gap-3">
                    
                    {/* Theme Toggle */}
                    <div className="flex items-center bg-[var(--muted)] rounded-full p-1 gap-1 border border-[var(--border)]">
                        <button
                            onClick={() => toggleTheme()}
                            className="p-1.5 rounded-full transition-all duration-300 flex items-center justify-center"
                        >
                            {theme === 'light' ? (
                                <Sun className="w-3.5 h-3.5 text-[var(--primary)]" />
                            ) : (
                                <Moon className="w-3.5 h-3.5 text-[var(--primary)]" />
                            )}
                        </button>
                    </div>

                    {/* User Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                setIsUserMenuOpen(!isUserMenuOpen);
                            }}
                            className="flex items-center gap-1.5 p-0.5 pr-2 rounded-full border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-all bg-[var(--card)]"
                        >
                            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <User className="w-4 h-4" />
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Logic */}
                        {isUserMenuOpen && (
                            <>
                                {/* Click-outside Overlay */}
                                <div 
                                    className="fixed inset-0 z-[60]" 
                                    onClick={() => setIsUserMenuOpen(false)}
                                ></div>
                                
                                {/* The Menu */}
                                <div className="absolute end-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right">
                                    
                                    {/* User Info Section */}
                                    <div className="px-3 py-2.5 border-b border-[var(--border)] bg-[var(--accent)]/10">
                                        <p className="text-[13px] font-bold text-[var(--foreground)] truncate">User Name</p>
                                        <p className="text-[11px] text-[var(--muted-foreground)] truncate">user@example.com</p>
                                    </div>

                                    {/* Menu Actions */}
                                    <div className="p-1">
                                        <button 
                                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors group"
                                        >
                                            <Globe className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="font-medium">Language</span>
                                                <span className="text-[9px] text-[var(--muted-foreground)] mt-0.5">Switch to Arabic</span>
                                            </div>
                                        </button>

                                        <div className="h-px bg-[var(--border)] my-1 mx-2 opacity-40" />

                                        <button 
                                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors group"
                                        >
                                            <LogOut className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                                            <span className="font-medium">Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Mobile Navigation Bar */}
            <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto border-t border-[var(--border)] pt-2 mt-1 scrollbar-hide">
                {navItems.map((item) => {
                    const isActive = url.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-1 rounded-full text-[13px] whitespace-nowrap transition-colors ${
                                isActive
                                    ? 'bg-[var(--primary)] text-white font-medium'
                                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </header>
    );
}