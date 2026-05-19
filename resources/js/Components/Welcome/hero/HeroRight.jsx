/**
 * @file HeroRight.jsx
 * @project Quantix — Intelligent Salla Store Management Platform
 *                    (Harees & Mustashar sub-platforms)
 *
 * @description
 * Visual column rendered on the right side of the landing-page hero.
 * Composed of three independently animated floating widgets that illustrate
 * Quantix's core product capabilities at a glance:
 *
 *  - <ScanCard>      — simulates a recently scanned product entry.
 *  - <StatusCard>    — shows a product row with a colour-coded status pill.
 *  - <Calculator3D>  — a stylised 3-D calculator representing Harees/Mustashar
 *                      calculation features.
 *
 * Each widget uses Framer Motion's infinite `y` keyframe loop to produce a
 * gentle floating effect. Delays are staggered so the widgets bob
 * independently and don't move in sync.
 *
 * @module Components/Welcome/hero/HeroRight
 */

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import StatusPill from '@/Components/ui/StatusPill';

// ---------------------------------------------------------------------------
// Hardcoded UI strings — all display copy isolated here for easy i18n migration.
// Move these values into your translations JSON and delete this object once ready.
// ---------------------------------------------------------------------------
/**
 * @type {object}
 * @description Static strings used internally by HeroRight and its sub-components.
 *   None of these are locale-driven today, but the structure makes them trivial
 *   to move into the shared `T` translations map.
 */
const t_static = {
    /** Unit label shown in the calculator display panel (Arabic: "10 cm"). */
    calcUnit: '10 سم',

    /** Sample numeric result rendered in the calculator display panel. */
    calcResult: '12',

    /** Alt text for the ShoppingBag icon inside StatusCard (used by screen readers). */
    statusCardIconAlt: 'Product icon',

    /** Alt text for the ShoppingBag icon inside ScanCard (used by screen readers). */
    scanCardIconAlt: 'Scanned product icon',
};

// ---------------------------------------------------------------------------
// Calculator button data — static config, not user-facing copy.
// Defined at module level so it is created once, not on every render.
// ---------------------------------------------------------------------------

/**
 * @typedef {'num'|'op'|'fn'|'clear'} BtnType
 * Semantic type of a calculator button; drives colour resolution via btnColor().
 */

/**
 * @typedef {object} CalcBtn
 * @property {string}  l - Display label rendered on the button face.
 * @property {BtnType} t - Semantic type; maps to a background colour.
 */

/**
 * Button row definitions for the main 4×4 calculator grid.
 * Row order: function row → digit rows (7–9, 4–6, 1–3).
 *
 * @type {CalcBtn[][]}
 */
const CALC_ROWS = [
    [{ l: 'C', t: 'clear' }, { l: '±', t: 'fn' }, { l: '%', t: 'fn' }, { l: '÷', t: 'op' }],
    [{ l: '7', t: 'num'   }, { l: '8', t: 'num' }, { l: '9', t: 'num' }, { l: '×', t: 'op' }],
    [{ l: '4', t: 'num'   }, { l: '5', t: 'num' }, { l: '6', t: 'num' }, { l: '-', t: 'op' }],
    [{ l: '1', t: 'num'   }, { l: '2', t: 'num' }, { l: '3', t: 'num' }, { l: '+', t: 'op' }],
];

/**
 * Bottom row buttons: wide zero, decimal separator, and equals.
 * Rendered in a 2fr 1fr 1fr grid so the zero key spans two columns.
 *
 * @type {CalcBtn[]}
 */
const CALC_BOTTOM = [{ l: '0', t: 'num' }, { l: '.', t: 'num' }, { l: '=', t: 'op' }];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a button's background colour based on its semantic type.
 * Operators use a lighter purple; special keys use progressively deeper shades.
 *
 * @param {BtnType} type - Semantic type of the button.
 * @returns {string} CSS hex colour value.
 */
function btnColor(type) {
    if (type === 'op')    return '#A855F7'; // Operator  → lighter purple
    if (type === 'clear') return '#5B21B6'; // Clear     → deep purple (high-prominence)
    if (type === 'fn')    return '#6D28D9'; // Function  → mid purple
    return '#7C3AED';                       // Number    → brand purple (default)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/* ─────────────────────────────────────────────
   StatusCard
   A floating product row displaying a status pill (safe / approaching / expired).
───────────────────────────────────────────── */

/**
 * StatusCard
 *
 * Floating card that mimics a product list row with an icon, skeleton
 * content lines, and a <StatusPill> on the right.
 * Lifts between 0 and −12 px in an infinite ease-in-out loop.
 *
 * @param {object} props
 * @param {'safe'|'approaching'|'expired'} props.status
 *   Status variant forwarded directly to <StatusPill>; controls pill colour.
 * @param {string} props.label
 *   Human-readable status label rendered inside the pill (e.g. "Safe", "منتهية").
 * @param {number} props.delay
 *   Animation start delay in seconds; stagger this across multiple cards so
 *   they don't bob in lockstep.
 * @returns {JSX.Element}
 */
export function StatusCard({ status, label, delay }) {
    return (
        /* Infinite vertical float: 0 → −12 px → 0, eased in and out */
        <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
            style={{
                background: 'white', borderRadius: 16, padding: '10px 14px',
                width: 210, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                display: 'flex', alignItems: 'center', gap: 10,
            }}
        >
            {/* Product icon badge — violet tint matches the brand accent */}
            <div style={{
                width: 32, height: 32, borderRadius: 9, background: '#EDE9FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <ShoppingBag size={16} color="#7C3AED" />
            </div>

            {/* Skeleton content lines — simulate product name + metadata rows */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Wider bar = product name */}
                <div style={{ height: 7, background: '#E5E7EB', borderRadius: 4, marginBottom: 5, width: '80%' }} />
                {/* Narrower bar = secondary metadata (e.g. SKU / date) */}
                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 4, width: '60%' }} />
            </div>

            {/* Colour-coded status pill — driven by `status` and `label` props */}
            <StatusPill status={status} label={label} />
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   ScanCard
   A floating skeleton card simulating a recently scanned product entry.
───────────────────────────────────────────── */

/**
 * ScanCard
 *
 * Smaller floating card that simulates a just-scanned product row.
 * Uses a blue accent (vs purple for StatusCards) to signal an active/live scan.
 * Float range is intentionally shallower (−8 px) than StatusCard (−12 px) for
 * visual variety across the widget column.
 *
 * @param {object} props
 * @param {number} props.delay
 *   Animation start delay in seconds for the infinite floating loop.
 * @returns {JSX.Element}
 */
export function ScanCard({ delay }) {
    return (
        /* Shorter float range (0 → −8 px) gives a subtler, faster bob */
        <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}
            style={{
                background: 'white', borderRadius: 13, padding: '9px 12px',
                width: 194, boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', gap: 9,
            }}
        >
            {/* Scan icon badge — blue tint differentiates from purple status cards */}
            <div style={{
                width: 29, height: 29, borderRadius: 7, background: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <ShoppingBag size={14} color="#3B82F6" />
            </div>

            {/* Skeleton content lines — simulate product name + scan timestamp */}
            <div style={{ flex: 1 }}>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, marginBottom: 4, width: '75%' }} />
                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 4, width: '55%' }} />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Calculator3D
   A stylised isometric-perspective calculator illustration.
───────────────────────────────────────────── */

/**
 * Calculator3D
 *
 * Decorative 3-D calculator rendered entirely with div/CSS — no SVG or images.
 * Perspective is achieved via `rotateX` + `rotateY` CSS transforms on the wrapper.
 * A solid offset shadow `<div>` behind the body creates the illusion of physical depth.
 *
 * Buttons are driven by the module-level CALC_ROWS / CALC_BOTTOM arrays and
 * coloured by `btnColor()`. Display copy (unit + result) is sourced from `t_static`
 * for easy i18n migration.
 *
 * @returns {JSX.Element}
 */
export function Calculator3D() {
    return (
        /* Slow bob: 0 → −10 px → 0, staggered 0.5 s from other widgets */
        <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{ position: 'relative', transform: 'perspective(500px) rotateX(8deg) rotateY(-15deg)' }}
        >
            {/* Offset shadow layer — shifted 10 px down-right; gives 3-D base illusion */}
            <div style={{
                position: 'absolute', top: 10, left: 10, right: -10, bottom: -10,
                background: '#3B0D82', borderRadius: 22, zIndex: 0,
            }} />

            {/* ── Calculator body ── */}
            <div style={{
                position: 'relative', zIndex: 1,
                background: 'linear-gradient(155deg, #6D28D9 0%, #9333EA 100%)',
                borderRadius: 22, padding: 11, width: 162,
                boxShadow: '0 20px 50px rgba(76,29,149,0.45)',
            }}>
                {/* ── Display panel: unit label (top-right) + numeric result ── */}
                <div style={{ background: '#3B0764', borderRadius: 11, padding: '7px 11px', marginBottom: 9 }}>
                    {/* Unit label — sourced from t_static; visually decorative */}
                    <div style={{ fontSize: 10, color: 'rgba(233,213,255,0.45)', marginBottom: 2, textAlign: 'right' }}>
                        {t_static.calcUnit}
                    </div>
                    {/* Sample calculation result — sourced from t_static */}
                    <div style={{ fontSize: 26, color: '#E9D5FF', fontWeight: 700, textAlign: 'right', lineHeight: 1 }}>
                        {t_static.calcResult}
                    </div>
                </div>

                {/* ── Main 4×4 button grid — rows driven by CALC_ROWS ── */}
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

                {/* ── Bottom row: "0" spans 2 fr, "." and "=" each span 1 fr ── */}
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
   HeroRight — default export
   Assembles the full right column of the hero section.
───────────────────────────────────────────── */

/**
 * @typedef {object} StatusLabels
 * @property {string} safe        - Label for the "safe" status pill.
 * @property {string} approaching - Label for the "approaching expiry" status pill.
 * @property {string} expired     - Label for the "expired" status pill.
 */

/**
 * HeroRight
 *
 * Composes the hero's right column: a vertical sub-column of ScanCard +
 * three StatusCards on the left, and the 3-D Calculator on the right.
 * The entire column enters with a single fade-in + slide-from-right animation
 * on page load; each child widget then runs its own independent float loop.
 *
 * Animation delay of 0.5 s lets the left (text) column render first,
 * directing the visitor's eye to the headline before the widgets appear.
 *
 * @param {object}       props
 * @param {object}       props.t               - Current language translations object.
 * @param {StatusLabels} props.t.statusLabels  - Locale-specific labels for each status pill.
 * @returns {JSX.Element}
 */
export default function HeroRight({ t }) {
    return (
        /* Entrance: fade in + slide from right (x: 40 → 0), delayed 0.5 s */
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
                display: 'flex', alignItems: 'center', gap: 22,
                justifyContent: 'center', padding: '1.5rem 0',
            }}
        >
            {/* ── Left sub-column: scan card at top, then staggered status cards ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* ScanCard bobs with a slightly shorter range and faster period */}
                <ScanCard delay={0.3} />

                {/* StatusCards staggered by 0.8 s each so they bob asynchronously */}
                <StatusCard status="safe"        label={t.statusLabels.safe}        delay={0}   />
                <StatusCard status="approaching" label={t.statusLabels.approaching} delay={0.8} />
                <StatusCard status="expired"     label={t.statusLabels.expired}     delay={1.6} />
            </div>

            {/* ── Right sub-column: 3-D calculator — pushes down slightly for visual balance ── */}
            <div style={{ flexShrink: 0, paddingTop: '1.5rem' }}>
                <Calculator3D />
            </div>
        </motion.div>
    );
}