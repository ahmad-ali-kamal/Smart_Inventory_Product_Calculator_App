// resources/js/Components/Mustashar/ProductRow.jsx
import { useState, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { ExternalLink, Pencil } from 'lucide-react';
import RowActionButton from '../Common/RowActionButton';
import Toggle from '../Common/Toggle';
import ProductAvatar from '../Common/ProductAvatar';
import { useUpdateProductCoverage } from '../../Hooks/useProducts';
import { validateCoverage } from '../../constants/calculatorSettings';

const COLS_WITH_PREVIEW    = 'grid-cols-[280px_1fr_1fr_1fr_1fr_1fr]';
const COLS_WITHOUT_PREVIEW = 'grid-cols-[280px_1fr_1fr_1fr_1fr]';

export default function ProductRow({ product, onToggle, fading = false, showPreview = false }) {
    const { auth } = usePage().props;
    const updateCoverage = useUpdateProductCoverage();

    const [isEditing, setIsEditing]         = useState(false);
    const [coverageValue, setCoverage]       = useState(product.coverage_per_unit ?? '');
    const [coverageError, setCoverageError]  = useState(null);
    const inputRef = useRef(null);

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

    const coverageDisplay = product.coverage_per_unit
        ? `${product.coverage_per_unit} m²`
        : '—';

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleEditStart = () => {
        setCoverage(String(product.coverage_per_unit ?? ''));
        setCoverageError(null);
        setIsEditing(true);
    };

    const handleSave = async () => {
        const err = validateCoverage(coverageValue);
        if (err) {
            setCoverageError(err);
            return;
        }

        const value = parseFloat(coverageValue);
        try {
            await updateCoverage.mutateAsync({ productId: product.id, coverage_per_unit: value });
        } catch (e) {
            console.error('Failed to update coverage:', e);
        }
        setCoverageError(null);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCoverageError(null);
        setCoverage(String(product.coverage_per_unit ?? ''));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter')  handleSave();
        if (e.key === 'Escape') handleCancel();
    };

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
                <ProductAvatar src={product.image} name={product.name} size={40} radius="rounded-xl" />
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

            {/* Unit Coverage Input */}
            <div className="flex justify-center items-center">
                <div className="flex flex-col items-center gap-1">
                    {isEditing ? (
                        <>
                            <input
                                ref={inputRef}
                                type="number"
                                value={coverageValue}
                                onChange={(e) => {
                                    setCoverage(e.target.value);
                                    setCoverageError(null);
                                }}
                                onKeyDown={handleKeyDown}
                                onBlur={handleSave}
                                step="0.01"
                                min="0.01"
                                max="200"
                                style={{
                                    width: '72px',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: 'var(--primary)',
                                    background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                                    border: `1px solid ${coverageError ? '#fca5a5' : 'color-mix(in srgb, var(--primary) 30%, transparent)'}`,
                                    borderRadius: '8px',
                                    padding: '4px 8px',
                                    outline: 'none',
                                    MozAppearance: 'textfield',
                                    WebkitAppearance: 'none',
                                    appearance: 'textfield',
                                }}
                            />
                            {coverageError && (
                                <span style={{
                                    fontSize: '9px',
                                    color: '#dc2626',
                                    maxWidth: '110px',
                                    textAlign: 'center',
                                    lineHeight: 1.3,
                                }}>
                                    {coverageError}
                                </span>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold font-mono text-[var(--primary)]">
                                {coverageDisplay}
                            </span>
                            <button
                                onClick={handleEditStart}
                                className="p-1 text-[var(--muted-foreground)] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all"
                                title="Edit coverage"
                            >
                                <Pencil size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Status */}
            <div className="flex justify-center items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                    product.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300'
                }`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                    product.active ? 'text-emerald-600' : 'text-[var(--muted-foreground)]'
                }`}>
                    {product.active ? 'Active' : 'Inactive'}
                </span>
            </div>

            {/* Toggle */}
            <div className="flex justify-center">
                <Toggle checked={product.active} onChange={() => onToggle(product.id)} />
            </div>

            {/* Preview link */}
            {showPreview && (
                <div className="flex justify-center">
                    {previewUrl ? (
                        <RowActionButton href={previewUrl} target="_blank" variant="active" icon={<ExternalLink size={11} />}>
                            Preview
                        </RowActionButton>
                    ) : (
                        <RowActionButton variant="disabled" icon={<ExternalLink size={11} />}>
                            Preview
                        </RowActionButton>
                    )}
                </div>
            )}
        </div>
    );
}