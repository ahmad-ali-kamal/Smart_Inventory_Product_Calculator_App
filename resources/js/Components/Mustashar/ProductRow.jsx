// resources/js/Components/Mustashar/ProductRow.jsx
import { usePage } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import RowActionButton from '../Common/RowActionButton';
import Toggle from "../Common/Toggle";
import ProductAvatar from "../Common/ProductAvatar";

const COLS_WITH_PREVIEW    = 'grid-cols-[280px_1fr_1fr_1fr_1fr]';
const COLS_WITHOUT_PREVIEW = 'grid-cols-[280px_1fr_1fr_1fr]';

export default function ProductRow({ product, onToggle, fading = false, showPreview = false }) {
    const { auth } = usePage().props;

    const sallaMerchantId = auth?.user?.salla_merchant_id;
    const sallaProductId  = product.salla_product_id;

    const productSlug = product.name
        ? product.name.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\u0621-\u064A\w\-]+/g, '')
            .replace(/--+/g, '-')
        : 'product';

    const previewUrl = (sallaMerchantId && sallaProductId)
        ? `https://salla.sa/intend/${sallaMerchantId}/${productSlug}/p${sallaProductId}`
        : null;

    return (
        <div
            className={`
                grid gap-4 px-8 py-4 items-center
                ${showPreview ? COLS_WITH_PREVIEW : COLS_WITHOUT_PREVIEW}
                transition-all duration-300
                ${fading ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'}
            `}
        >
            {/* Product info */}
            <div className="flex items-center gap-4 min-w-0">
                <ProductAvatar
                    src={product.image}
                    name={product.name}
                    size={40}
                    radius="rounded-xl"
                />
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--foreground)] truncate uppercase tracking-tight">
                        {product.name}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase">
                        {product.salla_product_id}
                    </p>
                </div>
            </div>

            {/* Category */}
            <div className="flex justify-center">
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                    {product.category}
                </span>
            </div>

            {/* Active status dot */}
            <div className="flex justify-center items-center gap-2">
                <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                        product.active
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-gray-300'
                    }`}
                />
                <span
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                        product.active ? 'text-emerald-600' : 'text-[var(--muted-foreground)]'
                    }`}
                >
                    {product.active ? 'active' : 'inactive'}
                </span>
            </div>

            {/* Toggle */}
            <div className="flex justify-center">
                <Toggle
                    checked={product.active}
                    onChange={() => onToggle(product.id)}
                />
            </div>

            {/* Preview — only rendered when showPreview=true */}
            {showPreview && (
                <div className="flex justify-center">
                    {previewUrl ? (
                        <RowActionButton
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="active"
                            icon={<ExternalLink size={11} />}
                        >
                            Preview
                        </RowActionButton>
                    ) : (
                        <RowActionButton
                            variant="disabled"
                            icon={<ExternalLink size={11} />}
                            title="بيانات الرابط غير مكتملة"
                        >
                            Preview
                        </RowActionButton>
                    )}
                </div>
            )}
        </div>
    );
}