// Components/Settings/CategoryMappingCard.jsx
//
// Single Responsibility: render the drag-and-drop category mapping section.
// Contains CategoryCard and BucketColumn as private sub-components
// since they are only ever used here.
//
import { Tag } from 'lucide-react';
import Card from '../../Common/Card';
import { BUCKET_CONFIG } from '../../../constants/inventorySettings';

// ── Private: draggable category pill ───────────────────────────────────────
function CategoryCard({ label, bucket, onDragStart }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, label, bucket)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] cursor-grab active:cursor-grabbing select-none hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
        >
            <span className="text-[var(--muted-foreground)]">⠿</span>
            {label}
        </div>
    );
}

// ── Private: drop zone bucket column ───────────────────────────────────────
function BucketColumn({ config, thresholdValue, categories, onDrop, onDragStart }) {
    return (
        <div
            onDrop={(e) => onDrop(e, config.key)}
            onDragOver={(e) => e.preventDefault()}
            className="flex-1 min-h-[150px] rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3 flex flex-col gap-2"
        >
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                    <span className="text-xs font-semibold text-[var(--foreground)]">{config.label}</span>
                </div>
                <span className={`text-xs font-bold ${config.count_color} bg-[var(--muted)] px-1.5 py-0.5 rounded-md`}>
                    {thresholdValue}d
                </span>
            </div>

            {categories.map((cat) => (
                <CategoryCard key={cat} label={cat} bucket={config.key} onDragStart={onDragStart} />
            ))}

            {categories.length === 0 && (
                <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--border)] rounded-lg text-xs text-[var(--muted-foreground)] py-4">
                    Drop here
                </div>
            )}
        </div>
    );
}

// ── Public: the full card ───────────────────────────────────────────────────
/**
 * @param {string[]} unassigned     — categories not yet in any bucket
 * @param {object}   categories     — { short, medium, long }
 * @param {object}   thresholds     — { short, medium, long } (shown as badge)
 * @param {function} onDragStart    — handler from hook
 * @param {function} onDrop        — handler from hook
 */
export default function CategoryMappingCard({
    unassigned,
    categories,
    thresholds,
    onDragStart,
    onDrop,
}) {
    return (
        <Card className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                    <Tag size={15} />
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Category Mapping</p>
            </div>

            {/* Unassigned pool */}
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

            {/* Bucket columns */}
            <div className="flex gap-3">
                {BUCKET_CONFIG.map((config) => (
                    <BucketColumn
                        key={config.key}
                        config={config}
                        thresholdValue={thresholds[config.key]}
                        categories={categories[config.key]}
                        onDrop={onDrop}
                        onDragStart={onDragStart}
                    />
                ))}
            </div>
        </Card>
    );
}