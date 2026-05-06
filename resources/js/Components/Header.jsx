import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTheme } from '../Context/ThemeContext';
import { Sun, Moon, User, LayoutGrid, ChevronDown, Globe, LogOut, BellRing, CheckCheck } from 'lucide-react';
import LangToggle from '../Components/LangToggle';

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const { url, props } = usePage();
    const user = props.auth?.user;
    const userName = user?.name || user?.store_info?.merchant?.username || 'المستخدم';
    const userEmail = user?.email || user?.store_info?.merchant?.email || '';
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isAr, setIsAr] = useState(false);

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    const isInventory = url.startsWith('/harees');

const fetchNotifications = () => {
    if (!isInventory) return;

    fetch('/harees/api/notifications', {
        headers: { Accept: 'application/json' },
        credentials: 'include',
    })
        .then(res => res.json())
        .then(data => {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read_at).length);
        })
        .catch(err => console.error('Notifications error:', err));
};

useEffect(() => {
    if (!isInventory) return;

    fetchNotifications();

    if (!isNotifOpen) return;

    const interval = setInterval(() => {
        fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
}, [isInventory, isNotifOpen]);

    const calculatorNav = [
        { label: 'Instructions', href: '/mustashar/instructions' },
        { label: 'Dashboard',    href: '/mustashar/dashboard' },
        { label: 'Products',     href: '/mustashar/products' },
        { label: 'Settings',     href: '/mustashar/settings' },
    ];

    const inventoryNav = [
        { label: 'Instructions', href: '/harees/instructions' },
        { label: 'Dashboard',    href: '/harees/dashboard' },
        { label: 'Products',     href: '/harees/products' },
        { label: 'Settings',     href: '/harees/settings' },
    ];

    
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
                    <span className="font-semibold text-[var(--foreground)] text-base tracking-tight">{appName}</span>
                </div>

                {/* 2. Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = url === item.href;
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

                {/* 3. Right Side Controls */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[var(--muted)] rounded-full p-1 border border-[var(--border)]">
                        <button onClick={toggleTheme} className="p-1.5 rounded-full flex items-center justify-center">
                            {theme === 'light'
                                ? <Sun className="w-3.5 h-3.5 text-[var(--primary)]" />
                                : <Moon className="w-3.5 h-3.5 text-[var(--primary)]" />}
                        </button>
                    </div>
                   

{isInventory && (
    <div className="relative">
        <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${
                isNotifOpen 
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' 
                : 'bg-[var(--accent)] text-[var(--primary)] border-[var(--border)] hover:border-[var(--primary)]'
            }`}
        >
           
            <BellRing className={`w-4 h-4 ${unreadCount > 0 ? 'animate-shake' : ''}`} />
            
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#f87171] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[var(--card)] shadow-sm">
                    {unreadCount}
                </span>
            )}
        </button>

        {isNotifOpen && (
            <>
                <div className="fixed inset-0 z-[60]" onClick={() => setIsNotifOpen(false)}></div>
                <div className="absolute end-0 mt-3 w-72 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--accent)]/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BellRing className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span className="text-xs font-bold text-[var(--foreground)]">Notifications</span>
                        </div>
                        <button 
                           onClick={() => {
    fetch('/harees/api/notifications/read-all', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
    }).then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
    }).then(() => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    }).catch(err => console.error('Mark all read error:', err));
}}
                            className="flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] hover:underline"
                        >
                            <CheckCheck className="w-3 h-3" />
                            Mark all read
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1 text-left" dir="ltr">
                        {notifications.length === 0 ? (
    <div className="p-4 text-center text-[11px] text-[var(--muted-foreground)]">
        No notifications
    </div>
) : (
    notifications.map((n) => (
        <NotificationItem
            key={n.id}
            title={n.data?.status === 'red' ? 'Expired Product!' : 'Expiry Approaching'}
            msg={`Batch ${n.data?.batch_code ?? ''} of "${n.data?.product_name ?? 'product'}" ${n.data?.status === 'red' ? 'has expired.' : 'is approaching its expiry date.'}`}
            color={n.data?.status === 'red' ? 'text-[#f87171]' : 'text-[#fbbf24]'}
            unread={!n.read_at}
        />
    ))
)}
                    </div>
                </div>
            </>
        )}
    </div>
)}
    
    <div className="relative">
        <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-1.5 p-1 pr-2 rounded-full border border-[var(--border)] hover:border-[var(--primary)] bg-[var(--card)] transition-all duration-200"
        >
            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0 shadow-sm">
                <User className="w-4 h-4" />
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
        </button>

                        {isUserMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setIsUserMenuOpen(false)}></div>
                                <div className="absolute end-0 mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right">
                                    
                                    {/* User Info */}
                                    <div className="px-3 py-2.5 border-b border-[var(--border)] bg-[var(--accent)]/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-bold text-[var(--foreground)] truncate">{userName}</p>
                                                <p className="text-[10px] text-[var(--muted-foreground)] truncate">{userEmail}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
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
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[11px] text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span className="font-bold uppercase">Log Out</span>
                                        </Link>
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
// Notification item component
function NotificationItem({ title, msg, color, unread }) {
    return (
        <div className={`p-3 rounded-lg hover:bg-[var(--accent)]/50 transition-colors cursor-pointer group relative ${unread ? 'bg-[var(--accent)]/20' : ''}`}>
            {unread && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
            <p className={`text-[11px] font-bold ${color} mb-0.5`}>{title}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] leading-tight group-hover:text-[var(--foreground)]">{msg}</p>
        </div>
    );
}