/**
 * Pages/Harees/Login.jsx
 *
 * This file intentionally stays thin — all visual logic lives in LoginLayout.
 * The only job here is to pass Harees-specific props (colours, image, translations).
 *
 * What benefits automatically from the LoginLayout upgrade:
 *  ✓ SplitText animation on "حريص / Harees" headline
 *  ✓ Reveal animation on the right panel
 *  ✓ useFonts hook (consistent font resolution across the app)
 *  ✓ No @import duplication — fonts loaded once via globalStyles.js
 */
import LoginLayout from '@/Layouts/LoginLayout';
import heroImage from '@/assets/hareesLogin.webp';
const T = {
    ar: {
        pageTitle:  'حريص — تسجيل الدخول',
        backHome:   'العودة للرئيسية',
        appName:    'حريص',
        appSub:     'إدارة المخزون الذكية',
        appDesc:    'نظام متكامل لمتابعة تواريخ الصلاحية، يُنظّم مخزونك دفعةً بدفعة ويحمي أرباحك من الهدر.',
        features: [
            'تتبع تواريخ الصلاحية دفعةً بدفعة',
            'تنبيهات المنتجات قريبة الانتهاء',
            'تقارير المخزون التفصيلية',
            'تكامل مباشر مع منصة سلة',
        ],
        steps: [
            { title: 'افتح متجرك في سلة',    sub: 'أنشئ حساب تاجر مجاني في منصة سلة' },
            { title: 'ثبّت تطبيق حريص',      sub: 'ابحث عن "حريص" في سوق تطبيقات سلة' },
            { title: 'سجّل دخولك هنا',        sub: 'استخدم بريد حساب سلة للدخول' },
        ],
        loginNow:  'سجّل دخولك الآن',
        loginSub:  'ادخل مباشرةً عبر حساب سلة',
        sallaBtn:  'دخول عبر سلة ←',
        note:      'حريص متاح حصرياً لتجار سلة — ثبّت التطبيق من متجر سلة للحصول على حسابك',
        support:   'حريص / الدعم الفني',
        already:   'لديك حساب بالفعل؟',
        loginLink: 'تسجيل الدخول',
    },
    en: {
        pageTitle:  'Harees — Login',
        backHome:   'Back to Home',
        appName:    'Harees',
        appSub:     'Smart Inventory Management',
        appDesc:    'A complete expiry monitoring system that organizes your inventory batch by batch and protects your profits from waste.',
        features: [
            'Batch-by-batch expiry date tracking',
            'Near-expiry product alerts',
            'Detailed inventory reports',
            'Direct Salla platform integration',
        ],
        steps: [
            { title: 'Open your Salla store',  sub: 'Create a free merchant account on Salla' },
            { title: 'Install Harees app',     sub: 'Search for "Harees" in the Salla App Market' },
            { title: 'Sign in here',           sub: 'Use your Salla account email to log in' },
        ],
        loginNow:  'Sign in now',
        loginSub:  'Access directly via your Salla account',
        sallaBtn:  'Continue with Salla →',
        note:      'Harees is exclusively available to Salla merchants — install from the Salla App Market to get your account',
        support:   'Harees / Support',
        already:   'Already have an account?',
        loginLink: 'Log in',
    },
};

export default function HareesLogin({ status }) {
    return (
        <LoginLayout
            translations={T}
            imageSrc={heroImage}  
            imageAlt="Harees"
            gradientFrom="#8D82FF"
            gradientTo="#B7AEFF"
            accentColor="#8D82FF"
            accentLight="#F4F1FF"
            shadowColor="141,130,255"
            authHref="/auth/salla?app=management"
             imageScale="scale-[1.15]"
            showBackHome={true}
            bgColor="#F5F2FA"
            status={status}
        />
    );
}

HareesLogin.layout = page => page;