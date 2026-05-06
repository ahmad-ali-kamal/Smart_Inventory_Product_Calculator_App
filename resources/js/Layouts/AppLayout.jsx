import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Navigation from '@/Components/Layout/Navigation';

/**
 * AppLayout — الـ Layout الرئيسي للتطبيقات المحمية
 *
 * الاستخدام:
 *   Calculator/Dashboard.jsx  → import AppLayout from '@/Components/Layout/AppLayout'
 *   export default function Dashboard() { ... }
 *   Dashboard.layout = page => <AppLayout app="calculator">{page}</AppLayout>
 *
 * Props:
 *   app      : 'calculator' | 'inventory'
 *   children : page content
 *   header   : optional page title string
 */
export default function AppLayout({ children, app = 'inventory', header }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const appMeta = {
        calculator: {
            label: 'حاسبة التكلفة',
            icon: '⚖️',
            accent: 'rgba(232,188,205,0.9)',
        },
        inventory: {
            label: 'إدارة المخزون',
            icon: '📦',
            accent: 'rgba(130,100,160,0.9)',
        },
    };

    const meta = appMeta[app] ?? appMeta.inventory;

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--color-bg)',
            direction: 'rtl',
        }}>

            {/* ─── Mobile overlay ──────────────────────── */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 40,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                />
            )}

            {/* ─── Sidebar ─────────────────────────────── */}
            <aside style={{
                width: sidebarOpen ? '260px' : '72px',
                minHeight: '100vh',
                background: 'rgba(14,8,19,0.95)',
                backdropFilter: 'blur(24px)',
                borderLeft: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                position: 'relative',
                flexShrink: 0,
                zIndex: 30,
                // Mobile: fixed
                ...(mobileOpen ? {
                    position: 'fixed', top: 0, right: 0,
                    height: '100vh', width: '260px', zIndex: 50,
                } : {}),
            }}>

                {/* Logo area */}
                <div style={{
                    padding: sidebarOpen ? '1.5rem 1.25rem' : '1.5rem 0',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--color-orchid) 0%, var(--color-purple) 100%)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px',
                        }}>
                            {meta.icon}
                        </div>
                        {sidebarOpen && (
                            <div>
                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    color: 'var(--color-orchid-light)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {meta.label}
                                </div>
                                <div style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.7rem',
                                    color: 'var(--color-text-faint)',
                                }}>
                                    {auth?.user?.name ?? 'التاجر'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Toggle button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            width: '28px', height: '28px',
                            background: 'rgba(232,188,205,0.06)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-faint)',
                            fontSize: '12px',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(232,188,205,0.12)';
                            e.currentTarget.style.color = 'var(--color-orchid)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(232,188,205,0.06)';
                            e.currentTarget.style.color = 'var(--color-text-faint)';
                        }}
                    >
                        {sidebarOpen ? '◂' : '▸'}
                    </button>
                </div>

                {/* Navigation links */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
                    <Navigation app={app} collapsed={!sidebarOpen} />
                </div>

                {/* Bottom: user + logout */}
                <div style={{
                    padding: sidebarOpen ? '1rem 1.25rem' : '1rem 0',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    alignItems: sidebarOpen ? 'stretch' : 'center',
                }}>
                    {sidebarOpen && (
                        <div style={{
                            padding: '10px 12px',
                            background: 'rgba(232,188,205,0.05)',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.82rem',
                                color: 'var(--color-orchid)',
                                fontWeight: '500',
                            }}>
                                {auth?.user?.name ?? 'المستخدم'}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.72rem',
                                color: 'var(--color-text-faint)',
                                marginTop: '2px',
                            }}>
                                {auth?.user?.email ?? ''}
                            </div>
                        </div>
                    )}

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        style={{
                            width: sidebarOpen ? '100%' : '40px',
                            height: sidebarOpen ? 'auto' : '40px',
                            padding: sidebarOpen ? '9px 12px' : '0',
                            background: 'transparent',
                            border: '1px solid rgba(232,188,205,0.1)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.82rem',
                            color: 'var(--color-text-faint)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: sidebarOpen ? 'flex-start' : 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            textDecoration: 'none',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,100,100,0.06)';
                            e.currentTarget.style.color = '#ff8080';
                            e.currentTarget.style.borderColor = 'rgba(255,100,100,0.15)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-faint)';
                            e.currentTarget.style.borderColor = 'rgba(232,188,205,0.1)';
                        }}
                    >
                        <span>⎋</span>
                        {sidebarOpen && <span>تسجيل الخروج</span>}
                    </Link>
                </div>
            </aside>

            {/* ─── Main Content ─────────────────────────── */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden',
            }}>

                {/* Top bar */}
                <header style={{
                    height: '60px',
                    borderBottom: '1px solid var(--color-border)',
                    padding: '0 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(14,8,19,0.8)',
                    backdropFilter: 'blur(12px)',
                    flexShrink: 0,
                    position: 'sticky', top: 0, zIndex: 20,
                }}>
                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden"
                        style={{
                            width: '36px', height: '36px',
                            background: 'rgba(232,188,205,0.06)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            fontSize: '14px',
                        }}
                    >
                        ☰
                    </button>

                    {header && (
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.3rem',
                            fontWeight: '600',
                            color: 'var(--color-orchid-light)',
                            margin: 0,
                        }}>
                            {header}
                        </h2>
                    )}

                    {/* Breadcrumb / right side placeholder */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                        <div className="badge">
                            <span className="badge-dot" />
                            {meta.label}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{
                    flex: 1,
                    padding: '2rem',
                    overflowY: 'auto',
                    animation: 'fadeUp 0.4s ease both',
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
}