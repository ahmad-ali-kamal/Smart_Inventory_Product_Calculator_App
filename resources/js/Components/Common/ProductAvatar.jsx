// resources/js/Components/UI/ProductAvatar.jsx

export default function ProductAvatar({ src, name, size = 40, radius = 'rounded-lg' }) {
    const initial = name?.charAt(0)?.toUpperCase() ?? '?';

    return (
        <div
            className={`${radius} overflow-hidden bg-[var(--muted)] border border-[var(--border)] shrink-0 flex items-center justify-center`}
            style={{ width: size, height: size }}
        >
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={e => {
                        // أظهر الـ fallback عند فشل تحميل الصورة
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}

            {/* Fallback — يظهر دائماً إن لم تكن هناك صورة، أو عند خطأ التحميل */}
            <span
                className="w-full h-full flex items-center justify-center text-[10px] font-black text-[var(--muted-foreground)] uppercase"
                style={{ display: src ? 'none' : 'flex' }}
            >
                {initial}
            </span>
        </div>
    );
}