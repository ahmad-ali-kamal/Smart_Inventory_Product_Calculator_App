import { Link, usePage } from '@inertiajs/react';

/**
 * Navigation — روابط الـ Sidebar
 *
 * Props:
 *   app       : 'calculator' | 'inventory'
 *   collapsed : boolean — إذا كان الـ sidebar مصغراً
 */

const NAV_ITEMS = {
    calculator: [
        { label: 'لوحة التحكم',  icon: '◈', href: '/calculator/dashboard',    route: 'calculator.dashboard' },
        { label: 'المنتجات',      icon: '◉', href: '/calculator/products',     route: 'calculator.products' },
        { label: 'الحسابات',      icon: '⊞', href: '/calculator/calculations', route: 'calculator.calculations' },
        { label: 'الإعدادات',     icon: '◎', href: '/calculator/settings',     route: 'calculator.settings' },
        { label: 'المساعدة',      icon: '◌', href: '/calculator/help',         route: 'calculator.help' },
    ],
    inventory: [
        { label: 'لوحة التحكم',  icon: '◈', href: '/inventory/dashboard', route: 'inventory.dashboard' },
        { label: 'المنتجات',      icon: '◉', href: '/inventory/products',  route: 'inventory.products' },
        { label: 'الدفعات',       icon: '⊟', href: '/inventory/batches',   route: 'inventory.batches' },
        { label: 'التقارير',      icon: '⊞', href: '/inventory/reports',   route: 'inventory.reports' },
        { label: 'الإعدادات',     icon: '◎', href: '/inventory/settings',  route: 'inventory.settings' },
    ],
};

const GROUP_LABELS = {
    calculator: [
        { label: 'الرئيسي',   items: [0, 1] },
        { label: 'الأدوات',   items: [2] },
        { label: 'النظام',    items: [3, 4] },
    ],
    inventory: [
        { label: 'الرئيسي',   items: [0, 1] },
        { label: 'المخزون',   items: [2, 3] },
        { label: 'النظام',    items: [4] },
    ],
};

export default function Navigation({ app = 'inventory', collapsed = false }) {
    const { url } = usePage();
    const items  = NAV_ITEMS[app]   ?? NAV_ITEMS.inventory;
    const groups = GROUP_LABELS[app] ?? GROUP_LABELS.inventory;

    const isActive = (href) => url.startsWith(href);

    return (
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {groups.map((group, gi) => (
                <div key={gi} style={{ marginBottom: '8px' }}>
                    {/* Group label */}
                    {!collapsed && (
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.68rem',
                            fontWeight: '600',
                            color: 'var(--color-text-faint)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '4px 12px 8px',
                        }}>
                            {group.label}
                        </div>
                    )}

                    {group.items.map(idx => {
                        const item   = items[idx];
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: collapsed ? 0 : '12px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    padding: collapsed ? '10px 0' : '10px 14px',
                                    borderRadius: '10px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.88rem',
                                    fontWeight: active ? '500' : '400',
                                    color: active ? 'var(--color-orchid)' : 'var(--color-text-muted)',
                                    background: active
                                        ? 'rgba(232,188,205,0.1)'
                                        : 'transparent',
                                    border: active
                                        ? '1px solid rgba(232,188,205,0.15)'
                                        : '1px solid transparent',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    marginBottom: '2px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'rgba(232,188,205,0.06)';
                                        e.currentTarget.style.color = 'var(--color-orchid-light)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                    }
                                }}
                                title={collapsed ? item.label : undefined}
                            >
                                {/* Active indicator bar */}
                                {active && (
                                    <div style={{
                                        position: 'absolute',
                                        right: 0, top: '20%', bottom: '20%',
                                        width: '3px',
                                        background: 'var(--color-orchid)',
                                        borderRadius: '3px 0 0 3px',
                                    }} />
                                )}

                                {/* Icon */}
                                <span style={{
                                    fontSize: collapsed ? '18px' : '14px',
                                    width: collapsed ? 'auto' : '20px',
                                    textAlign: 'center',
                                    flexShrink: 0,
                                    filter: active ? 'none' : 'opacity(0.5)',
                                    transition: 'filter 0.2s',
                                }}>
                                    {item.icon}
                                </span>

                                {/* Label */}
                                {!collapsed && (
                                    <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}