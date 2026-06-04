/**
 * LangToggle — زر تبديل اللغة
 * يُستخدم في كل الصفحات
 *
 * Props:
 *   isAr   : boolean
 *   toggle : function
 *   style  : optional extra styles
 */
export default function LangToggle({ isAr, toggle, style: extra = {} }) {
    return (
        <button
            onClick={toggle}
            style={{
                background: 'var(--accent)',
                border: '1px solid var(--primary)/5',
                borderRadius: '8px',
                padding: '5px 14px',
                color: 'var(--primary)',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
                fontFamily: isAr
                    ? "'Cairo', sans-serif"
                    : "'Changa', sans-serif",
                ...extra,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 80%, var(--primary) 20%)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--accent)';
            }}
        >
            {isAr ? 'ENGLISH' : 'عربي'}
        </button>
    );
}