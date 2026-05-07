import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import StatusPill from '@/Components/ui/StatusPill';

/* ─────────────────────────────────────────────
   StatusCard
   A floating product row with an animated status pill.
───────────────────────────────────────────── */
export function StatusCard({ status, label, delay }) {
    return (
        <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
            style={{
                background: 'white', borderRadius: 16, padding: '10px 14px',
                width: 210, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                display: 'flex', alignItems: 'center', gap: 10,
            }}
        >
            <div style={{
                width: 32, height: 32, borderRadius: 9, background: '#EDE9FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <ShoppingBag size={16} color="#7C3AED" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ height: 7, background: '#E5E7EB', borderRadius: 4, marginBottom: 5, width: '80%' }} />
                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 4, width: '60%' }} />
            </div>
            <StatusPill status={status} label={label} />
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   ScanCard
   A floating skeleton card simulating a scanned product.
───────────────────────────────────────────── */
export function ScanCard({ delay }) {
    return (
        <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}
            style={{
                background: 'white', borderRadius: 13, padding: '9px 12px',
                width: 194, boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', gap: 9,
            }}
        >
            <div style={{
                width: 29, height: 29, borderRadius: 7, background: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <ShoppingBag size={14} color="#3B82F6" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, marginBottom: 4, width: '75%' }} />
                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 4, width: '55%' }} />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Calculator3D
   A stylised 3-D calculator illustration used in the hero.
───────────────────────────────────────────── */
const CALC_ROWS = [
    [{ l: 'C', t: 'clear' }, { l: '±', t: 'fn' }, { l: '%', t: 'fn' }, { l: '÷', t: 'op' }],
    [{ l: '7', t: 'num'   }, { l: '8', t: 'num' }, { l: '9', t: 'num' }, { l: '×', t: 'op' }],
    [{ l: '4', t: 'num'   }, { l: '5', t: 'num' }, { l: '6', t: 'num' }, { l: '-', t: 'op' }],
    [{ l: '1', t: 'num'   }, { l: '2', t: 'num' }, { l: '3', t: 'num' }, { l: '+', t: 'op' }],
];

const CALC_BOTTOM = [{ l: '0', t: 'num' }, { l: '.', t: 'num' }, { l: '=', t: 'op' }];

function btnColor(type) {
    if (type === 'op')    return '#A855F7';
    if (type === 'clear') return '#5B21B6';
    if (type === 'fn')    return '#6D28D9';
    return '#7C3AED';
}

export function Calculator3D() {
    return (
        <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{ position: 'relative', transform: 'perspective(500px) rotateX(8deg) rotateY(-15deg)' }}
        >
            {/* Shadow layer */}
            <div style={{
                position: 'absolute', top: 10, left: 10, right: -10, bottom: -10,
                background: '#3B0D82', borderRadius: 22, zIndex: 0,
            }} />

            {/* Calculator body */}
            <div style={{
                position: 'relative', zIndex: 1,
                background: 'linear-gradient(155deg, #6D28D9 0%, #9333EA 100%)',
                borderRadius: 22, padding: 11, width: 162,
                boxShadow: '0 20px 50px rgba(76,29,149,0.45)',
            }}>
                {/* Display */}
                <div style={{ background: '#3B0764', borderRadius: 11, padding: '7px 11px', marginBottom: 9 }}>
                    <div style={{ fontSize: 10, color: 'rgba(233,213,255,0.45)', marginBottom: 2, textAlign: 'right' }}>10 سم</div>
                    <div style={{ fontSize: 26, color: '#E9D5FF', fontWeight: 700, textAlign: 'right', lineHeight: 1 }}>12</div>
                </div>

                {/* Button grid */}
                {CALC_ROWS.map((row, ri) => (
                    <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 4 }}>
                        {row.map((btn, bi) => (
                            <div key={bi} style={{
                                background: btnColor(btn.t), borderRadius: 7, height: 28,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 11, fontWeight: 700,
                            }}>
                                {btn.l}
                            </div>
                        ))}
                    </div>
                ))}

                {/* Bottom row: 0, ., = */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 4 }}>
                    {CALC_BOTTOM.map((btn, bi) => (
                        <div key={bi} style={{
                            background: btnColor(btn.t), borderRadius: 7, height: 28,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 11, fontWeight: 700,
                        }}>
                            {btn.l}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   HeroRight
   Composes the right column of the hero with all floating widgets.
───────────────────────────────────────────── */
export default function HeroRight({ t }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
                display: 'flex', alignItems: 'center', gap: 22,
                justifyContent: 'center', padding: '1.5rem 0',
            }}
        >
            {/* Status cards column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ScanCard delay={0.3} />
                <StatusCard status="safe"        label={t.statusLabels.safe}        delay={0} />
                <StatusCard status="approaching" label={t.statusLabels.approaching} delay={0.8} />
                <StatusCard status="expired"     label={t.statusLabels.expired}     delay={1.6} />
            </div>

            {/* Calculator */}
            <div style={{ flexShrink: 0, paddingTop: '1.5rem' }}>
                <Calculator3D />
            </div>
        </motion.div>
    );
}