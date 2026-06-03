/**
 * @file CategoryMappingCard.jsx
 * @module Components/Harees/Settings
 *
 * @description
 * Presentational card that renders the drag-and-drop Category Mapping section
 * of the Harees Settings page.
 *
 * Responsibilities:
 *  - Displays the unassigned category pool as draggable pills.
 *  - Renders one `BucketColumn` per expiry bucket (short / medium / long),
 *    each acting as a drop target.
 *  - Delegates all drag-and-drop state mutations upward to `useInventorySettingsForm`
 *    via `onDragStart` and `onDrop`.
 *
 * Sub-components (private, only used here):
 *  - `CategoryCard`  — a single draggable category pill.
 *  - `BucketColumn`  — a drop-zone column for one expiry bucket.
 *
 * Single Responsibility: rendering only. Drag state lives in the hook.
 */

import { Tag } from 'lucide-react';
import Card from '../../Common/UI/Card';
import { BUCKET_CONFIG } from '../../../constants/inventorySettings';
import { useTranslation } from 'react-i18next';

// ── Private: draggable category pill ───────────────────────────────────────

/**
 * A single draggable pill representing one product category.
 *
 * @param {object}   props
 * @param {string}   props.label      — Category display name.
 * @param {string}   props.bucket     — Current bucket key (or `"unassigned"`).
 * @param {function} props.onDragStart — `(e, label, bucket) => void`
 * @returns {JSX.Element}
 */
function CategoryCard({ label, bucket, onDragStart }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, label, bucket)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] cursor-grab active:cursor-grabbing select-none hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
        >
            {/* Drag handle glyph */}
            <span className="text-[var(--muted-foreground)]">⠿</span>
            {label}
        </div>
    );
}

// ── Private: drop-zone bucket column ───────────────────────────────────────

/**
 * A drop-target column representing one expiry bucket.
 * Renders its assigned categories as `CategoryCard` pills and shows a
 * dashed placeholder when the bucket is empty.
 *
 * @param {object}   props
 * @param {object}   props.config          — Bucket config entry from `BUCKET_CONFIG`.
 * @param {string}   props.config.key      — Bucket key (e.g. `"short"`).
 * @param {string}   props.config.label    — Display label (e.g. `"Short"`).
 * @param {string}   props.config.dot      — Tailwind class for the status dot colour.
 * @param {string}   props.config.count_color — Tailwind class for the threshold badge text.
 * @param {number}   props.thresholdValue  — Threshold day count shown as a badge.
 * @param {string[]} props.categories      — Category labels currently in this bucket.
 * @param {function} props.onDrop          — `(e, bucketKey) => void`
 * @param {function} props.onDragStart     — `(e, label, bucketKey) => void`
 * @returns {JSX.Element}
 */
function BucketColumn({ config, thresholdValue, categories, onDrop, onDragStart, t }) {
    const translatedLabel = t(`category_mapping_card.bucket_label_${config.key}`);
    return (
        <div
            onDrop={(e) => onDrop(e, config.key)}
            onDragOver={(e) => e.preventDefault()}   // required to allow dropping
            className="flex-1 min-h-[150px] rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3 flex flex-col gap-2"
        >
            {/* Bucket header: coloured status dot + label + threshold badge */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                    <span className="text-xs font-semibold text-[var(--foreground)]">{translatedLabel}</span>
                </div>
                <span className={`text-xs font-bold ${config.count_color} bg-[var(--muted)] px-1.5 py-0.5 rounded-md`}>
                    {thresholdValue}{t('category_mapping_card.threshold_suffix')}
                </span>
            </div>

            {/* Assigned category pills */}
            {categories.map((cat) => (
                <CategoryCard key={cat} label={cat} bucket={config.key} onDragStart={onDragStart} />
            ))}

            {/* Empty-state drop placeholder — shown when the bucket has no categories */}
            {categories.length === 0 && (
                <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--border)] rounded-lg text-xs text-[var(--muted-foreground)] py-4">
                    {t('category_mapping_card.bucket_drop_cta')}
                </div>
            )}
        </div>
    );
}

// ── Public: the full card ───────────────────────────────────────────────────

/**
 * Category mapping card with an unassigned pool and three bucket columns.
 *
 * @param {object}   props
 * @param {string[]} props.unassigned  — Categories not yet assigned to any bucket.
 * @param {{ short: string[], medium: string[], long: string[] }} props.categories
 *   — Categories currently assigned to each bucket.
 * @param {{ short: number, medium: number, long: number }} props.thresholds
 *   — Threshold day values displayed as badges on each bucket column.
 * @param {function} props.onDragStart — Drag start handler: `(e, label, fromBucket) => void`.
 * @param {function} props.onDrop      — Drop handler: `(e, toBucket) => void`.
 * @returns {JSX.Element}
 */
export default function CategoryMappingCard({
    unassigned,
    categories,
    thresholds,
    onDragStart,
    onDrop,
}) {
    const { t } = useTranslation('harees');
    return (
        <Card className="p-5 space-y-4">

            {/* ── Card header ───────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                    <Tag size={15} />
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{t('category_mapping_card.card_title')}</p>
            </div>

            {/* ── Unassigned pool ────────────────────────────────────────── */}
            {/* Only rendered when there are categories not yet in a bucket */}
            {unassigned.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {unassigned.map((cat) => (
                        <div
                            key={cat}
                            draggable
                            onDragStart={(e) => onDragStart(e, cat, 'unassigned')}
                            className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs cursor-grab"
                        >
                            {cat}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Bucket columns ─────────────────────────────────────────── */}
            <div className="flex gap-3">
                {BUCKET_CONFIG.map((config) => (
                    <BucketColumn
                        key={config.key}
                        config={config}
                        thresholdValue={thresholds[config.key]}
                        categories={categories[config.key]}
                        onDrop={onDrop}
                        onDragStart={onDragStart}
                        t={t}
                    />
                ))}
            </div>

        </Card>
    );
}