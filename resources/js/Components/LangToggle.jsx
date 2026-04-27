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
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '5px 14px',
                color: 'rgba(255,255,255,0.65)',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                fontFamily: isAr
                    ? "'Cormorant Garamond', serif"
                    : "'Almarai', sans-serif",
                ...extra,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
        >
            {isAr ? 'ENGLISH' : 'عربي'}
        </button>
    );
}