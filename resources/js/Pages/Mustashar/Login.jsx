import { Head } from '@inertiajs/react';
import { useLang } from '@/Hooks/useLang';
import GuestLayout from '@/Layouts/GuestLayout';
import GuestNavbar from '@/Components/GuestNavbar';
import { useState, useEffect } from 'react';
import LoginCard from '@/Components/LoginCard';
import InfoPanel from '@/Components/InfoPanel';

const T = {
    ar: {
        pageTitle: 'المستشار — تسجيل الدخول',
        backHome:  'العودة للرئيسية',
        appName:   'المستشار',
        appSub:    'مستشارك التجاري الذكي',
        appDesc:   'منصة متكاملة تُحلّل بيانات متجرك وتُقدّم توصيات ذكية لتنمية مبيعاتك وتحسين قراراتك التجارية.',
        features: [
            'تحليلات مبيعات لحظية وتنبؤات دقيقة',
            'توصيات تسعير مدعومة بالذكاء الاصطناعي',
            'تقارير أداء أسبوعية وشهرية',
            'تنبيهات فرص النمو الفوري',
        ],
        steps: [
            { title: 'افتح متجرك في سلة',    sub: 'أنشئ حساب تاجر مجاني في منصة سلة' },
            { title: 'ثبّت تطبيق المستشار',  sub: 'ابحث عن "المستشار" في سوق تطبيقات سلة' },
            { title: 'سجّل دخولك هنا',       sub: 'استخدم بريد حساب سلة للدخول' },
        ],
        loginNow: 'سجّل دخولك الآن',
        loginSub: 'ادخل مباشرةً عبر حساب سلة',
        sallaBtn: 'دخول عبر سلة ←',
        note:     'المستشار متاح حصرياً لتجار سلة — ثبّت التطبيق من متجر سلة للحصول على حسابك',
    },
    en: {
        pageTitle: 'Mustashar — Login',
        backHome:  'Back to Home',
        appName:   'Mustashar',
        appSub:    'Your Smart Business Advisor',
        appDesc:   'An all-in-one platform that analyses your store data and delivers AI-powered recommendations to grow your sales.',
        features: [
            'Real-time sales analytics and forecasts',
            'AI-powered pricing recommendations',
            'Weekly and monthly performance reports',
            'Instant growth opportunity alerts',
        ],
        steps: [
            { title: 'Open your Salla store',  sub: 'Create a free merchant account on Salla' },
            { title: 'Install Mustashar app',  sub: 'Search for "Mustashar" in the Salla App Market' },
            { title: 'Sign in here',           sub: 'Use your Salla account email to log in' },
        ],
        loginNow: 'Sign in now',
        loginSub: 'Access directly via your Salla account',
        sallaBtn: 'Continue with Salla →',
        note:     'Mustashar is exclusively available to Salla merchants — install from the Salla App Market to get your account',
    },
};

/*
 * FIX: Mustashar now uses the same purple palette as Harees for unified
 * visual identity across both products.
 */
const HERO_BG = 'linear-gradient(155deg, #110330 0%, #2A0868 38%, #3B0F90 62%, #1C0445 100%)';
const ACCENT  = '#7C3AED';

export default function MustasharLogin({ status }) {
    const { lang, isAr, dir, ff } = useLang();
    const t = T[lang];
    const bodyFont = lang === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif";
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(timer);
    }, []);

    const cardSlide = isAr ? '-32px' : '32px';
    const infoSlide = isAr ? '32px' : '-32px';

    return (
        <>
            <Head title={t.pageTitle} />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Changa:wght@700;800&family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html, body { height: 100%; }

                .card-anim {
                    opacity: 0;
                    transform: translateX(${cardSlide});
                    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1),
                                transform 0.7s cubic-bezier(0.16,1,0.3,1);
                }
                .card-anim.show { opacity: 1; transform: translateX(0); }

                .info-anim {
                    opacity: 0;
                    transform: translateX(${infoSlide});
                    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.12s,
                                transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.12s;
                }
                .info-anim.show { opacity: 1; transform: translateX(0); }

                .salla-btn {
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    width: 100%; padding: 0.95rem 1.5rem;
                    background: ${ACCENT}; color: #fff;
                    border: none; border-radius: 12px;
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    cursor: pointer; text-decoration: none;
                    transition: all 0.25s;
                    box-shadow: 0 4px 14px rgba(124,58,237,0.35);
                }
                .salla-btn:hover {
                    background: #6D28D9;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(124,58,237,0.5);
                }

                .step-row {
                    display: flex; align-items: center; gap: 12px;
                    padding: 12px 14px; border-radius: 14px;
                    transition: background 0.35s ease;
                }
                .step-row.active-step { background: rgba(124,58,237,0.07); }

                /*
                 * FIX: card-panel is absolutely positioned edge-to-edge (top:0, height:100%)
                 * so there is zero gap between the white panel and the purple hero.
                 */
                .card-panel {
                    position: absolute;
                    top: 0;
                    ${isAr ? 'left: 0;' : 'right: 0;'}
                    width: clamp(340px, 46%, 520px);
                    height: 100%;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem 2rem;
                    overflow-y: auto;
                    box-shadow: ${isAr
                        ? '8px 0 48px rgba(0,0,0,0.45)'
                        : '-8px 0 48px rgba(0,0,0,0.45)'};
                    z-index: 5;
                }

                /* ---------- mobile ---------- */
                @media (max-width: 768px) {
                    .card-panel {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        background: #fff !important;
                        box-shadow: none !important;
                        align-items: flex-start;
                        padding: 0 1.25rem 2.5rem;
                        overflow-y: auto;
                        z-index: 10 !important;
                    }
                    .dark-info { display: none !important; }
                }
            `}</style>

            <div style={{
                width: '100vw',
                height: '100vh',
                background: HERO_BG,
                position: 'relative',
                overflow: 'hidden',
                direction: dir,
            }}>
                {/* Glow orbs */}
                <div style={{
                    position: 'absolute', top: '-200px',
                    [isAr ? 'left' : 'right']: '-200px',
                    width: '600px', height: '600px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-150px',
                    [isAr ? 'right' : 'left']: '-100px',
                    width: '450px', height: '450px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(165,243,252,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                {/*
                 * FIX: Navbar is transparent, sits above all panels via z-index:20.
                 */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
                    background: 'transparent',
                }}>
                    <GuestNavbar variant="login" backLabel={t.backHome} transparent />
                </div>

                {/* Dark info panel */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'flex-end',
                    paddingInlineEnd: 'clamp(340px, 46%, 520px)',
                    zIndex: 1,
                }}>
                    <InfoPanel
                        t={t}
                        isAr={isAr}
                        ff={ff}
                        bodyFont={bodyFont}
                        visible={visible}
                    />
                </div>

                {/* White card panel */}
                <div className="card-panel">
                    <LoginCard
                        t={t}
                        isAr={isAr}
                        ff={ff}
                        bodyFont={bodyFont}
                        visible={visible}
                        status={status}
                        accent={ACCENT}
                    />
                </div>
            </div>
        </>
    );
}

MustasharLogin.layout = page => <GuestLayout>{page}</GuestLayout>;