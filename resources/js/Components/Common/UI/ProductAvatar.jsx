/**
 * @file ProductAvatar.jsx
 * @module Components/Common/UI
 *
 * @description
 * Compact avatar component used to represent a product visually.
 * Renders a product image when a `src` URL is available, and gracefully falls
 * back to a single uppercase initial derived from the product `name` when:
 *   - no `src` is provided, OR
 *   - the image URL is broken / fails to load at runtime.
 *
 * The fallback initial is always visible in the DOM (display:none when hidden)
 * so the `onError` handler can reveal it instantly without a re-render.
 *
 * @example
 * // With a valid image URL
 * <ProductAvatar src={product.image_url} name={product.name} />
 *
 * @example
 * // Fallback to initial — no src provided
 * <ProductAvatar name="Cement Bag" size={48} radius="rounded-full" />
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move to your JSON locale file when ready (e.g. en.json → "product_avatar": { … })
const t = {
    /** Alt text for the product image (receives the product name at runtime) */
    image_alt: (name) => name ?? 'Product image',
    /** Character shown when no name is available */
    fallback_initial: '?',
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProductAvatar
 *
 * @param {Object}  props
 * @param {string}  [props.src]             - URL of the product image. Omit to show the initial fallback.
 * @param {string}  [props.name]            - Product name. The first character is used as the fallback initial.
 * @param {number}  [props.size=40]         - Width and height of the avatar in pixels.
 * @param {string}  [props.radius='rounded-lg'] - Tailwind border-radius class applied to the container.
 * @returns {JSX.Element}
 */
export default function ProductAvatar({ src, name, size = 40, radius = 'rounded-lg' }) {

    /** Derive the uppercase initial; default to '?' when name is absent */
    const initial = name?.charAt(0)?.toUpperCase() ?? t.fallback_initial;

    return (
        <div
            className={`${radius} overflow-hidden bg-[var(--muted)] border border-[var(--border)] shrink-0 flex items-center justify-center`}
            style={{ width: size, height: size }}
        >
            {/*
             * Image element — only rendered when `src` is truthy.
             * The `onError` handler hides the broken image and reveals the
             * fallback <span> below without triggering a React re-render.
             */}
            {src ? (
                <img
                    src={src}
                    alt={t.image_alt(name)}
                    className="w-full h-full object-cover"
                    onError={e => {
                        // Hide the broken image tag
                        e.currentTarget.style.display = 'none';
                        // Reveal the sibling fallback span
                        e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}

            {/*
             * Fallback initial — always present in the DOM.
             * Hidden via inline style when a valid `src` is provided;
             * revealed by the onError handler if the image fails to load.
             */}
            <span
                className="w-full h-full flex items-center justify-center text-[10px] font-black text-[var(--muted-foreground)] uppercase"
                style={{ display: src ? 'none' : 'flex' }}
            >
                {initial}
            </span>
        </div>
    );
}