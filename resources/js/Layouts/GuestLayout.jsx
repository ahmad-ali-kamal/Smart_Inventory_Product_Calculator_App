import { useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';

/**
 * GuestLayout — Layout صفحات تسجيل الدخول
 *
 * الاستخدام:
 *   Auth/CalculatorLogin.jsx:
 *     import GuestLayout from '@/Components/Layout/GuestLayout'
 *     export default function CalculatorLogin() { ... }
 *     CalculatorLogin.layout = page => <GuestLayout app="calculator">{page}</GuestLayout>
 *
 * Props:
 *   app      : 'calculator' | 'inventory'
 *   children : form content
 */
export default function GuestLayout({ children, app = 'inventory' }) {
    const canvasRef = useRef(null);

    const appMeta = {
        calculator: {
            label:       'حاسبة التكلفة',
            description: 'احسب تكلفة منتجاتك وهامش ربحك بدقة.',
            icon:        '⚖️',
            glow:        'rgba(232,188,205,0.18)',
            gradient:    'linear-gradient(135deg, rgba(232,188,205,0.15) 0%, rgba(82,56,89,0.25) 100%)',
        },
        inventory: {
            label:       'إدارة المخزون',
            description: 'تتبع دفعاتك وتواريخ صلاحيتها في الوقت الفعلي.',
            icon:        '📦',
            glow:        'rgba(130,100,160,0.25)',
            gradient:    'linear-gradient(135deg, rgba(130,100,160,0.15) 0%, rgba(82,56,89,0.25) 100%)',
        },
    };

    const meta = appMeta[app] ?? appMeta.inventory;

    /* Particle background */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const setSize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        setSize();

        const particles = Array.from({ length: 40 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.3,
            dx: (Math.random() - 0.5) * 0.25,
            dy: (Math.random() - 0.5) * 0.25,
            a: Math.random() * 0.4 + 0.05,
        }));

        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
                if (p.y < 0 || p.y > canvas.height)  p.dy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(232,188,205,${p.a})`;
                ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        };
        draw();

        window.addEventListener('resize', setSize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize); };
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            direction: 'rtl',
            background: 'var(--color-bg)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Grain */}
            <div className="grain-overlay" />

            {/* Background glow */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                background: `
                    radial-gradient(ellipse 60% 50% at 50% 0%, rgba(82,56,89,0.5) 0%, transparent 70%),
                    radial-gradient(ellipse 40% 40% at 100% 100%, ${meta.glow} 0%, transparent 60%)
                `,
            }} />

            {/* ─── Left panel: branding ────────────────── */}
            <div style={{
                flex: '0 0 45%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '4rem',
                position: 'relative',
                borderLeft: '1px solid var(--color-border)',
            }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        pointerEvents: 'none', zIndex: 0,
                    }}
                />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s ease both' }}>
                    {/* Back to home */}
                    <Link
                        href="/"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.82rem',
                            color: 'var(--color-text-faint)',
                            textDecoration: 'none',
                            marginBottom: '3rem',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-orchid)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-faint)'}
                    >
                        <span>→</span>
                        <span>العودة للرئيسية</span>
                    </Link>

                    {/* App icon */}
                    <div style={{
                        width: '72px', height: '72px',
                        background: meta.gradient,
                        border: '1px solid rgba(232,188,205,0.2)',
                        borderRadius: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px',
                        marginBottom: '2rem',
                        boxShadow: `0 0 40px ${meta.glow}`,
                    }}>
                        {meta.icon}
                    </div>

                    <div className="badge" style={{ marginBottom: '1.5rem' }}>
                        <span className="badge-dot" />
                        حريص
                    </div>

                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
                        fontWeight: '700',
                        color: 'var(--color-orchid-light)',
                        marginBottom: '1rem',
                        lineHeight: 1.2,
                    }}>
                        {meta.label}
                    </h1>

                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '1rem',
                        color: 'var(--color-text-muted)',
                        lineHeight: 1.7,
                        maxWidth: '380px',
                    }}>
                        {meta.description}
                    </p>

                    {/* Decorative line */}
                    <div style={{
                        marginTop: '3rem',
                        height: '1px',
                        width: '60px',
                        background: 'linear-gradient(to left, transparent, var(--color-orchid))',
                    }} />
                </div>
            </div>

            {/* ─── Right panel: form ───────────────────── */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                position: 'relative', zIndex: 1,
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '440px',
                    animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
                    animationDelay: '0.15s',
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}