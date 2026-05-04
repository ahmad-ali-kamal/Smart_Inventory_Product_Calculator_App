import { useRef } from 'react';
import LiquidEther from '@/Pages/LiquidEther';

/**
 * GuestLayout — Layout موحّد لصفحات الضيوف (Welcome + Login)
 *
 * ✅ الهدف: خلفية LiquidEther تبقى حيّة ومستمرة عند التنقل بين الصفحات
 *   لأن Inertia تُعيد استخدام نفس instance الـ Layout بدلاً من إعادة mount
 *
 * الاستخدام في كل صفحة ضيف:
 *   Welcome.jsx:
 *     Welcome.layout = page => <GuestLayout>{page}</GuestLayout>
 *
 *   Login.jsx (Harees أو Mustashar):
 *     Login.layout = page => <GuestLayout>{page}</GuestLayout>
 *
 * Props:
 *   children : محتوى الصفحة (يتغير عند التنقل، لكن الخلفية تبقى)
 */
export default function GuestLayout({ children }) {
    // نحتفظ بـ ref على الـ wrapper لمنع إعادة mount الـ canvas عند تغيير الصفحة
    const backgroundRef = useRef(null);

    return (
        <div style={{ position: 'relative', minHeight: '100vh', background: '#0F0E17' }}>

            {/*
             * ✅ PERSISTENT BACKGROUND
             * هذا الـ div لا يتغير أبداً — Inertia لا تُعيد render الـ layout
             * فـ LiquidEther تظل تعمل طوال رحلة المستخدم بين الصفحات
             */}
            <div
                ref={backgroundRef}
                style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: '100%',
                    height: '100vh',
                    zIndex: 0,
                    pointerEvents: 'none',
                    // خلفية صلبة داكنة فوراً قبل تحميل الـ WebGL
                    background: '#0F0E17',
                }}
            >
                <LiquidEther
                    colors={['#5227ff', '#ff9ffc', '#b497cf']}
                    resolution={0.5}
                    autoDemo={true}
                    autoSpeed={0.5}
                    autoIntensity={2.2}
                />
            </div>

            {/*
             * ✅ PAGE CONTENT
             * هذا الجزء فقط هو اللي يتغير عند الانتقال بين الصفحات
             * الـ children تحتوي على محتوى الصفحة (Welcome أو Login)
             * position: relative + zIndex: 1 يجعلها فوق الخلفية
             */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}
