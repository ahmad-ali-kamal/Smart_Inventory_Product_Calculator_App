import { Head } from '@inertiajs/react';
import { useLang } from '@/Hooks/useLang';
import GuestLayout from '@/Layouts/GuestLayout';
import GuestNavbar from '@/Components/GuestNavbar';
import { useState, useEffect } from 'react';
import LoginCard from '@/Components/LoginCard';
import InfoPanel from '@/Components/InfoPanel';

const T = {
    ar: {
        pageTitle: 'حريص — تسجيل الدخول',
        backHome:  'العودة للرئيسية',
        appName:   'حريص',
        appSub:    'إدارة المخزون الذكية',
        appDesc:   'نظام متكامل لمتابعة تواريخ الصلاحية، يُنظّم مخزونك دفعةً بدفعة ويحمي أرباحك من الهدر.',
        features: [
            'خصومات ذكية للمنتجات قرب الانتهاء',
            'مزامنة فورية مع كتالوج سلة',
            'تتبع متعدد الدفعات',
            'إشعارات تنبيه تلقائية',
        ],
        steps: [
            { title: 'افتح متجرك في سلة', sub: 'أنشئ حساب تاجر مجاني في منصة سلة' },
            { title: 'ثبّت تطبيق حريص',   sub: 'ابحث عن "حريص" في سوق تطبيقات سلة' },
            { title: 'سجّل دخولك هنا',    sub: 'استخدم بريد حساب سلة للدخول' },
        ],
        loginNow: 'سجّل دخولك الآن',
        loginSub: 'ادخل مباشرةً عبر حساب سلة',
        sallaBtn: 'دخول عبر سلة ←',
        note:     'حريص متاح حصرياً لتجار سلة — ثبّت التطبيق من متجر سلة للحصول على حسابك',
    },
    en: {
        pageTitle: 'Harees — Login',
        backHome:  'Back to Home',
        appName:   'Harees',
        appSub:    'Smart Inventory Management',
        appDesc:   'A complete expiry monitoring system that organizes your inventory batch by batch and protects your revenue from waste.',
        features: [
            'Smart discounts on near-expiry items',
            'Instant sync with Salla catalog',
            'Multi-batch expiry tracking',
            'Automated alert notifications',
        ],
        steps: [
            { title: 'Open your Salla store',  sub: 'Create a free merchant account on Salla' },
            { title: 'Install Harees app',     sub: 'Search for "Harees" in the Salla App Market' },
            { title: 'Sign in here',           sub: 'Use your Salla account email to log in' },
        ],
        loginNow: 'Sign in now',
        loginSub: 'Access directly via your Salla account',
        sallaBtn: 'Continue with Salla →',
        note:     'Harees is exclusively available to Salla merchants — install from the Salla App Market to get your account',
    },
};

/*
 * HERO_BG — mesh gradient:
 *   من فوق: #110330 (نفس لون الهيدر بالضبط) ← seamless مع الـ navbar
 *   أزرق electric (#0047ab) ← وسط يسار
 *   موف فاتح (#6d28d9)      ← وسط الصفحة
 *   تركوازي-أزرق (#0369a1) ← أسفل يمين
 *   قاعدة: #0c0220 داكنة
 */
const HERO_BG = [
    'radial-gradient(ellipse at 50%  0%,  #110330 0%, transparent 38%)',
    'radial-gradient(ellipse at 15% 38%,  #0047ab 0%, transparent 48%)',
    'radial-gradient(ellipse at 72% 52%,  #6d28d9 0%, transparent 52%)',
    'radial-gradient(ellipse at 82% 90%,  #0369a1 0%, transparent 48%)',
    'radial-gradient(ellipse at 10% 82%,  #1e3a5f 0%, transparent 42%)',
    '#0c0220',
].join(', ');

const ACCENT = '#7C3AED';
const CARD_W  = 'clamp(420px, 46%, 560px)';

export default function HareesLogin({ status }) {
    const { lang, isAr, dir, ff } = useLang();
    const t = T[lang];
    const bodyFont = lang === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif";
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(timer);
    }, []);

    const cardSlide = isAr ? '-40px' : '40px';
    const infoSlide = isAr ? '40px'  : '-40px';

    return (
        <>
            <Head title={t.pageTitle} />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Changa:wght@700;800&family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html, body { height: 100%; overflow: hidden; }

                .card-anim {
                    opacity: 0;
                    transform: translateX(${cardSlide});
                    transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1);
                }
                .card-anim.show { opacity: 1; transform: translateX(0); }

                .info-anim {
                    opacity: 0;
                    transform: translateX(${infoSlide});
                    transition: opacity .7s cubic-bezier(.16,1,.3,1) .12s, transform .7s cubic-bezier(.16,1,.3,1) .12s;
                }
                .info-anim.show { opacity: 1; transform: translateX(0); }

                .salla-btn {
    display: flex; align-items: center; justify-content: center;
    width: 100%; padding: .9rem 1.5rem;
    background: rgba(147, 51, 234, 0.7); 
    border: 1.5px solid rgba(216, 180, 254, 0.5); 
    color: #fff;
    border-radius: 12px;
    font-family: inherit; font-size: 1rem; font-weight: 700;
    cursor: pointer; text-decoration: none;
    transition: all .25s;
    backdrop-filter: blur(8px); 
    box-shadow: 0 4px 15px rgba(147, 51, 234, 0.3); 
}

.salla-btn:hover {
    background: rgba(168, 85, 247, 1); 
    border-color: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(168, 85, 247, 0.5);
}

                .step-row {
                    display: flex; align-items: center; gap: 12px;
                    padding: 10px 12px; border-radius: 14px;
                    transition: background .35s ease;
                }
                .step-row.active-step { background: rgba(255,255,255,.08); }

                .card-panel {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    ${isAr ? 'left: 0;' : 'right: 0;'}
                    width: ${CARD_W};
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 72px 2rem 2rem;
                    overflow-y: auto;
                    z-index: 5;
                }

                @media (max-width: 768px) {
                    .card-panel {
                        left: 0 !important; right: 0 !important;
                        width: 100% !important;
                        padding: 72px 1.25rem 2rem !important;
                    }
                    .dark-info { display: none !important; }
                }
            `}</style>

            <div style={{
                width: '100vw', height: '100vh',
                background: HERO_BG,
                position: 'relative',
                overflow: 'hidden',
                direction: dir,
            }}>
                {/* Orb — أزرق electric يعزز المنطقة العلوية-الوسطى */}
                <div style={{
                    position: 'absolute', top: '-80px',
                    [isAr ? 'right' : 'left']: '8%',
                    width: '580px', height: '380px', borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(0,100,210,.22) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />
                {/* Orb — موف في المنتصف */}
                <div style={{
                    position: 'absolute', top: '28%',
                    [isAr ? 'left' : 'right']: '18%',
                    width: '480px', height: '480px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(109,40,217,.25) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />
                {/* Orb — تركوازي أسفل */}
                <div style={{
                    position: 'absolute', bottom: '-80px',
                    [isAr ? 'left' : 'right']: '-60px',
                    width: '480px', height: '480px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(3,105,161,.3) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />

                {/* Navbar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, background: 'transparent' }}>
                    <GuestNavbar variant="login" backLabel={t.backHome} transparent />
                </div>

                {/* Info panel */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    paddingTop: '80px',
                    paddingInlineEnd: CARD_W,
                    zIndex: 1,
                }}>
                    <InfoPanel t={t} isAr={isAr} ff={ff} bodyFont={bodyFont} visible={visible} />
                </div>

                {/* Glass card panel */}
                <div className="card-panel">
                    <LoginCard
                        t={t} isAr={isAr} ff={ff} bodyFont={bodyFont}
                        visible={visible} status={status} accent={ACCENT}
                    />
                </div>
            </div>
        </>
    );
}

HareesLogin.layout = page => <GuestLayout>{page}</GuestLayout>;