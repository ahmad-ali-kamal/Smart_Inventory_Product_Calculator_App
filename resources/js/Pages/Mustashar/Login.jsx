/**
 * Pages/Mustashar/Login.jsx
 *
 * This file intentionally stays thin — all visual logic lives in LoginLayout.
 * The only job here is to pass Mustashar-specific props (colours, image, translations).
 *
 * What benefits automatically from the LoginLayout upgrade:
 *  ✓ SplitText animation on "المستشار / Mustashar" headline
 *  ✓ Reveal animation on the right panel
 *  ✓ useFonts hook (consistent font resolution across the app)
 *  ✓ No @import duplication — fonts loaded once via globalStyles.js
 */
import LoginLayout from '@/Layouts/LoginLayout';
import heroImage from '@/assets/mustasharLogin.webp';
const T = {
    ar: {
        pageTitle:  'المستشار — تسجيل الدخول',
        backHome:   'العودة للرئيسية',
        appName:    'المستشار',
        appSub:     'دليلك الذكي لحساب الكميات بدقة',
        appDesc:    'ودّع أخطاء القياس وهدر المخزون. المستشار يساعد عملائك على حساب احتياجهم الدقيق من (الأمتار، المساحات، أو القطع) بذكاء وسهولة، مباشرة من صفحة المنتج.',
        features: [
            'حساب دقيق لاحتياج العميل بناءً على القياسات',
            'تخصيص نسبة الهدر المناسبة لك',
            'واجهة ذكية تندمج بتصميم متجرك',
            'تحسين تجربة الشراء وتقليل استفسارات الدعم',
        ],
        steps: [
            { title: 'امتلك متجراً في سلة',     sub: 'تأكد من تفعيل متجرك على منصة سلة' },
            { title: 'ثبّت تطبيق المستشار',     sub: 'ستجده في متجر تطبيقات سلة بكل سهولة' },
            { title: 'ابدأ الإعداد بضغطة زر',   sub: 'سجّل دخولك واربط منتجاتك في ثوانٍ' },
        ],
        loginNow:  'تسجيل الدخول',
        loginSub:  'وصول سريع وآمن عبر حسابك في سلة',
        sallaBtn:  'الدخول عبر سلة ←',
        note:      'تطبيق المستشار مصمم خصيصاً لخدمة تجار سلة. تأكد من تثبيت التطبيق أولاً لتتمكن من الدخول.',
        support:   'مركز المساعدة والدعم الفني',
        already:   'لديك حساب بالفعل؟',
        loginLink: 'تسجيل الدخول',
    },
    en: {
        pageTitle:  'Mustashar — Login',
        backHome:   'Back Home',
        appName:    'Mustashar',
        appSub:     'The Smart Quantity Guide for Your Store',
        appDesc:    'Say goodbye to measurement errors and stock waste. Mustashar helps your customers calculate exactly what they need (Meters, Areas, or Units) directly from the product page.',
        features: [
            'Precise quantity calculation based on customer input',
            'Customizable waste percentage per product',
            'Seamless UI snippet that matches your store identity',
            'Enhanced shopping experience & fewer support inquiries',
        ],
        steps: [
            { title: 'Have a Salla Store',  sub: 'Ensure your merchant account is active on Salla' },
            { title: 'Install Mustashar',   sub: 'Find us easily in the Salla App Store' },
            { title: 'Start Setting Up',    sub: 'Log in and sync your products in seconds' },
        ],
        loginNow:  'Sign In',
        loginSub:  'Fast and secure access via your Salla account',
        sallaBtn:  'Continue with Salla →',
        note:      'Mustashar is exclusively built for Salla merchants. Please install the app first to gain access.',
        support:   'Help Center & Support',
        already:   'Already have an account?',
        loginLink: 'Log in',
    },
};

export default function MustasharLogin() {
    return (
        <LoginLayout
            translations={T}
               imageSrc={heroImage} 
            imageAlt="Mustashar"
            gradientFrom="#8B7CFF"
            gradientTo="#B6A9FF"
            accentColor="#8B7CFF"
            accentLight="#EEEDFB"
            shadowColor="104,96,212"
            authHref="/auth/salla/redirect"
            imageScale="scale-[1.25]"
            showBackHome={true}
            bgColor="#F1EDFF"
        />
    );
}

MustasharLogin.layout = page => page;