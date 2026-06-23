import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTheme } from '../../Context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../Context/LanguageContext';
import { Sun, Moon, User, ChevronDown, Globe, LogOut, BellRing, CheckCheck } from 'lucide-react';
import LangToggle from './LangToggle';

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const { url, props } = usePage();
    const user = props.auth?.user;
    const userName = user?.name || user?.store_info?.merchant?.username || 'المستخدم';
    const userEmail = user?.email || user?.store_info?.merchant?.email || '';
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const { t } = useTranslation('shared');
    const { isAr, toggle: toggleLang } = useLang();
  
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
        { label: t('header.nav.instructions'), href: '/qiasat/instructions' },
        { label: t('header.nav.dashboard'),    href: '/qiasat/dashboard' },
        { label: t('header.nav.products'),     href: '/qiasat/products' },
        { label: t('header.nav.settings'),     href: '/qiasat/settings' },
    ];

    const inventoryNav = [
        { label: t('header.nav.instructions'), href: '/harees/instructions' },
        { label: t('header.nav.dashboard'),    href: '/harees/dashboard' },
        { label: t('header.nav.products'),     href: '/harees/products' },
        { label: t('header.nav.settings'),     href: '/harees/settings' },
    ];
       const navItems = isInventory ? inventoryNav : calculatorNav;
    const appName  = isInventory ? t('header.app_harees') : t('header.app_mustashar');
    const logoSrc  = isInventory
        ? '/logos/HAREES_logo.png'
        : '/logos/QIASAT_logo.png';

    const toggleMobileNav = () => setIsMobileNavOpen(prev => !prev);
    const closeMobileNav = () => setIsMobileNavOpen(false);

    /* Close mobile nav on route change */
    useEffect(() => {
        closeMobileNav();
    }, [url]);

    /* Prevent body scroll when mobile nav is open */
    useEffect(() => {
        document.body.classList.toggle('no-scroll', isMobileNavOpen);
    }, [isMobileNavOpen]);

    /* Close dropdowns on Escape */
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setIsUserMenuOpen(false);
                setIsNotifOpen(false);
                setIsMobileNavOpen(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)] transition-colors duration-300">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between"
                 style={{ maxWidth: 'min(90vw, 80rem)' }}>

                {/* 1. Mobile menu toggle (left) */}
                <button
                    className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--accent)] transition-colors"
                    onClick={toggleMobileNav}
                    aria-label={isAr ? 'فتح القائمة' : 'Toggle menu'}
                    aria-expanded={isMobileNavOpen}
                >
                    <div className="w-5 h-4 relative flex flex-col justify-between">
                        <span className={`block h-0.5 w-full bg-[var(--foreground)] rounded transition-transform duration-200 ${isMobileNavOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                        <span className={`block h-0.5 w-full bg-[var(--foreground)] rounded transition-opacity duration-200 ${isMobileNavOpen ? 'opacity-0' : ''}`} />
                        <span className={`block h-0.5 w-full bg-[var(--foreground)] rounded transition-transform duration-200 ${isMobileNavOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                    </div>
                </button>

                {/* 1. Logo & App Name */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                        <img src={logoSrc} alt={appName} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-semibold text-[var(--foreground)] text-base tracking-tight">{appName}</span>
                </div>

                {/* 2. Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1"
                     aria-label={isAr ? 'القائمة الرئيسية' : 'Main navigation'}>
                    {navItems.map((item) => {
                        const isActive = url === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
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
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center bg-[var(--muted)] rounded-full p-1 border border-[var(--border)]">
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-full flex items-center justify-center"
                            aria-label={isAr ? 'تبديل السمة' : 'Toggle theme'}
                        >
                            {theme === 'light'
                                ? <Sun className="w-3.5 h-3.5 text-[var(--primary)]" />
                                : <Moon className="w-3.5 h-3.5 text-[var(--primary)]" />}
                        </button>
                    </div>

                    {isInventory && (
                        <div className="relative">
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                aria-label={isAr ? 'الإشعارات' : 'Notifications'}
                                aria-expanded={isNotifOpen}
                                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${
                                    isNotifOpen
                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                                        : 'bg-[var(--accent)] text-[var(--primary)] border-[var(--border)] hover:border-[var(--primary)]'
                                }`}
                            >
                                <BellRing className={`w-4 h-4 ${unreadCount > 0 ? 'animate-shake' : ''}`} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-[#f87171] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[var(--card)] shadow-sm">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setIsNotifOpen(false)} aria-hidden="true"></div>
                                    <div className="absolute end-0 mt-3 w-72 sm:w-80 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right"
                                         role="dialog" aria-label={isAr ? 'الإشعارات' : 'Notifications'}>
                                        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--accent)]/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <BellRing className="w-3.5 h-3.5 text-[var(--primary)]" />
                                                <span className="text-xs font-bold text-[var(--foreground)]">{t('header.notifications_title') || 'Notifications'}</span>
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
                                                {t('header.notifications_mark_read')}
                                            </button>
                                        </div>

                                        <div className="max-h-64 overflow-y-auto p-1" role="list">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-[11px] text-[var(--muted-foreground)]">
                                                    {t('header.notifications_empty')}
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
                            aria-label={isAr ? 'قائمة المستخدم' : 'User menu'}
                            aria-expanded={isUserMenuOpen}
                        >
                            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <User className="w-4 h-4" />
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isUserMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setIsUserMenuOpen(false)} aria-hidden="true"></div>
                                <div className="absolute end-0 mt-2 w-52 sm:w-56 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right"
                                     role="menu" aria-label={isAr ? 'قائمة المستخدم' : 'User menu'}>
                                    <div className="px-3 py-2.5 border-b border-[var(--border)] bg-[var(--accent)]/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-[var(--foreground)] truncate">{userName}</p>
                                                <p className="text-[10px] text-[var(--muted-foreground)] truncate">{userEmail}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-1">
                                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5 opacity-60" />
                                                <span className="text-xs font-medium">{t('header.user_menu.language')}</span>
                                            </div>
                                            <LangToggle
                                                isAr={isAr}
                                                toggle={toggleLang}
                                                style={{ fontSize: '8px', padding: '2px 6px' }}
                                            />
                                        </div>
                                        <div className="h-px bg-[var(--border)] my-1 mx-2 opacity-40" />
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            role="menuitem"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span className="font-bold uppercase">{t('header.user_menu.logout')}</span>
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile menu hamburger spacer - only on very small */}
                    <button
                        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--accent)] transition-colors"
                        onClick={toggleMobileNav}
                        aria-label={isAr ? 'فتح القائمة' : 'Toggle menu'}
                        aria-expanded={isMobileNavOpen}
                    >
                        <div className="w-5 h-4 relative flex flex-col justify-between">
                            <span className={`block h-0.5 w-full bg-[var(--foreground)] rounded transition-transform duration-200 ${isMobileNavOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                            <span className={`block h-0.5 w-full bg-[var(--foreground)] rounded transition-opacity duration-200 ${isMobileNavOpen ? 'opacity-0' : ''}`} />
                            <span className={`block h-0.5 w-full bg-[var(--foreground)] rounded transition-transform duration-200 ${isMobileNavOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Overlay */}
            {isMobileNavOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobileNav} aria-hidden="true" />
            )}

            {/* Mobile Navigation Drawer */}
            <div className={`fixed top-0 start-0 z-50 h-full w-3/4 max-w-xs bg-[var(--background)] border-e border-[var(--border)] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
                isMobileNavOpen ? 'translate-x-0' : isAr ? 'translate-x-full' : '-translate-x-full'
            }`}
                 role="dialog"
                 aria-modal="true"
                 aria-label={isAr ? 'القائمة الرئيسية' : 'Mobile navigation'}
            >
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <span className="font-bold text-[var(--foreground)]">{isAr ? 'القائمة' : 'Menu'}</span>
                    <button
                        onClick={closeMobileNav}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--accent)] transition-colors"
                        aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
                    >
                        <span className="text-lg">&times;</span>
                    </button>
                </div>
                <nav className="p-4 flex flex-col gap-1" aria-label={isAr ? 'روابط التصفح' : 'Navigation links'}>
                    {navItems.map((item) => {
                        const isActive = url === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMobileNav}
                                aria-current={isActive ? 'page' : undefined}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? 'bg-[var(--primary)] text-white shadow-sm'
                                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Mobile bottom nav bar (horizontal scroll pills, visible only on mobile when drawer is closed) */}
            {!isMobileNavOpen && (
                <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto border-t border-[var(--border)] pt-2 mt-1 scrollbar-hide"
                     role="navigation"
                     aria-label={isAr ? 'التنقل السريع' : 'Quick navigation'}
                >
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={url === item.href ? 'page' : undefined}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                                url === item.href ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)]'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
}

function NotificationItem({ title, msg, color, unread }) {
    return (
        <div className={`p-3 rounded-lg hover:bg-[var(--accent)]/50 transition-colors cursor-pointer group relative ${unread ? 'bg-[var(--accent)]/20' : ''}`}>
            {unread && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
            <p className={`text-[11px] font-bold ${color} mb-0.5`}>{title}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] leading-tight group-hover:text-[var(--foreground)]">{msg}</p>
        </div>
    );
}