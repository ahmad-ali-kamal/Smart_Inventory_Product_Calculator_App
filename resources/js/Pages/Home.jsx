import React from 'react';
import { Head } from '@inertiajs/react';

export default function Home({ locale, auth }) {
    return (
        <div style={{ backgroundColor: '#0A0A0A', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Head title="Quantix - Ready" />
            <h1 style={{ fontSize: '4rem', color: '#8B5CF6', fontWeight: 'bold', marginBottom: '1rem' }}>
                QUANTIX
            </h1>
            <p style={{ fontSize: '1.5rem', opacity: 0.7 }}>
                مبروك يا أحمد! الصفحة اشتغلت والربط سليم 🚀
            </p>
            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <p>اللغة الحالية: {locale}</p>
                <p>المتجر: {auth?.user?.name || 'غير مسجل'}</p>
            </div>
        </div>
    );
}