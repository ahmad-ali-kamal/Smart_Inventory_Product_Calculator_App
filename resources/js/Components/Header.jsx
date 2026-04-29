import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTheme } from '../Context/ThemeContext';
import { Sun, Moon, User, LayoutGrid, ChevronDown, Globe, LogOut } from 'lucide-react';
import LangToggle from '../Components/LangToggle';

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const { url } = usePage();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isAr, setIsAr] = useState(false);

    // روابط "المستشار" - تأكدي أن البادئة مطابقة لـ web.php
    const calculatorNav = [
        { label: 'Instructions', href: '/mustashar/instructions' },
        { label: 'Dashboard',    href: '/mustashar/dashboard' },
        { label: 'Products',     href: '/mustashar/products' },
        { label: 'Settings',     href: '/mustashar/settings' },
    ];

    // روابط "حريص" - تأكدي أن البادئة مطابقة لـ web.php
    const inventoryNav = [
        { label: 'Dashboard', href: '/harees/dashboard' },
        // أضيفي روابط حريص هنا لاحقاً
    ];

    // المنطق الجديد: الفحص بناءً على الأسماء التي اخترتيها (harees)
    const isInventory = url.startsWith('/harees');
    const navItems = isInventory ? inventoryNav : calculatorNav;
    const appName = isInventory ? 'حريص' : 'المستشار';

    return (
        <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)] transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

                {/* 1. Logo & App Name */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-sm">
                        <LayoutGrid className="w-4 h-4 text-white" />
                    </div>
                    {/* اسم التطبيق سيتغير الآن بشكل صحيح */}
                    <span className="font-semibold text-[var(--foreground)] text-base tracking-tight">{appName}</span>
                </div>

                {/* 2. Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        // استخدام startsWith للـ active عشان لو كنتي في صفحة فرعية يفضل الزر منور
                        const isActive = url === item.href || url.startsWith(item.href);
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

                {/* باقي الهيدر (الثيم، القائمة، إلخ) يبقى كما هو بنفس ستايله */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[var(--muted)] rounded-full p-1 border border-[var(--border)]">
                        <button onClick={toggleTheme} className="p-1.5 rounded-full flex items-center justify-center">
                            {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-[var(--primary)]" /> : <Moon className="w-3.5 h-3.5 text-[var(--primary)]" />}
                        </button>
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-1.5 p-0.5 pr-2 rounded-full border border-[var(--border)] hover:border-[var(--primary)] bg-[var(--card)]"
                        >
                            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isUserMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setIsUserMenuOpen(false)}></div>
                                <div className="absolute end-0 mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right">
                                    <div className="px-3 py-2.5 border-b border-[var(--border)] bg-[var(--accent)]/10">
                                        <p className="text-[12px] font-bold text-[var(--foreground)] truncate">User Name</p>
                                        <p className="text-[10px] text-[var(--muted-foreground)] truncate">user@example.com</p>
                                    </div>

                                    <div className="p-1">
                                        <div className="flex items-center justify-between px-2 py-1.5 hover:bg-[var(--accent)] rounded-lg transition-colors group">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5 opacity-60" />
                                                <span className="text-[11px] font-medium">Language</span>
                                            </div>
                                            <LangToggle 
                                                isAr={isAr} 
                                                toggle={() => setIsAr(!isAr)} 
                                                style={{ fontSize: '8px', padding: '2px 6px' }} 
                                            />
                                        </div>
                                        <div className="h-px bg-[var(--border)] my-1 mx-2 opacity-40" />
                                        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[11px] text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span className="font-bold uppercase">Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto border-t border-[var(--border)] pt-2 mt-1 scrollbar-hide">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-1 rounded-full text-[12px] whitespace-nowrap ${
                            url === item.href ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)]'
                        }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </header>
    );
}