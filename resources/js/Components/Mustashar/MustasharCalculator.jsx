import React from 'react';

const MustasharCalculator = () => {
    return (
        <div className="illus-wrap w-full flex-1 relative z-[2] select-none">
            <style>{`
                @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes spin-slow { from {transform: rotate(0deg)} to {transform: rotate(360deg)} }
                .f1{animation:float1 5s ease-in-out infinite}
                .calc{animation:float1 6s ease-in-out infinite;animation-delay:-1s}
                .symbol{animation:float1 4s ease-in-out infinite; font-family: sans-serif; font-weight: bold;}
            `}</style>

            <svg viewBox="0 0 280 270" width="100%" xmlns="http://www.w3.org/2000/svg" className="block">
                
                {/* ─── علامات الضرب والقسمة الصغيرة حول الحاسبة ─── */}
                <text x="50" y="60" fontSize="15" fill="rgba(255,255,255,0.4)" className="symbol f1">×</text>
                <text x="220" y="80" fontSize="18" fill="rgba(255,255,255,0.3)" className="symbol" style={{animationDelay: '-2s'}}>÷</text>
                <text x="40" y="180" fontSize="14" fill="rgba(255,255,255,0.2)" className="symbol" style={{animationDelay: '-1s'}}>÷</text>
                <text x="240" y="200" fontSize="16" fill="rgba(255,255,255,0.3)" className="symbol" style={{animationDelay: '-3s'}}>×</text>
                <text x="140" y="30" fontSize="12" fill="rgba(255,255,255,0.5)" className="symbol">×</text>

                {/* ─── الحاسبة (أبيض وموف) ─── */}
                <g className="calc">
                    {/* الظل السفلي */}
                    <ellipse cx="140" cy="252" rx="62" ry="10" fill="rgba(104, 96, 212, 0.15)" filter="blur(6px)"/>

                    {/* جسم الحاسبة */}
                    <rect x="88" y="68" width="104" height="160" rx="14" fill="#7C3AED" stroke="#6860D4" strokeWidth="1.5" />
                    
                    {/* الشاشة */}
                    <rect x="98" y="78" width="84" height="32" rx="6" fill="#FFFFFF" stroke="rgba(104, 96, 212, 0.4)" strokeWidth="1"/>
                    <text x="140" y="100" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6860D4" fontFamily="monospace">12,240</text>
                    
                    {/* أزرار الحاسبة */}
                    <g transform="translate(98, 120)">
                        <rect x="0" y="0" width="18" height="14" rx="4" fill="rgba(104,96,212,0.12)"/>
                        <rect x="22" y="0" width="18" height="14" rx="4" fill="rgba(104,96,212,0.12)"/>
                        <rect x="44" y="0" width="18" height="14" rx="4" fill="rgba(104,96,212,0.12)"/>
                        <rect x="66" y="0" width="18" height="14" rx="4" fill="#6860D4"/>

                        <rect x="0" y="18" width="18" height="14" rx="4" fill="rgba(104,96,212,0.06)"/>
                        <rect x="22" y="18" width="18" height="14" rx="4" fill="rgba(104,96,212,0.06)"/>
                        <rect x="44" y="18" width="18" height="14" rx="4" fill="rgba(104,96,212,0.06)"/>
                        <rect x="66" y="18" width="18" height="14" rx="4" fill="#6860D4"/>

                        <rect x="0" y="36" width="18" height="14" rx="4" fill="rgba(104,96,212,0.06)"/>
                        <rect x="22" y="36" width="18" height="14" rx="4" fill="rgba(104,96,212,0.06)"/>
                        <rect x="44" y="36" width="18" height="14" rx="4" fill="rgba(104,96,212,0.06)"/>
                        <rect x="66" y="36" width="18" height="30" rx="4" fill="#6860D4"/>

                        <rect x="0" y="54" width="18" height="14" rx="4" fill="rgba(104,96,212,0.06)"/>
                        <rect x="22" y="54" width="40" height="14" rx="4" fill="rgba(104,96,212,0.06)"/>
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default MustasharCalculator;