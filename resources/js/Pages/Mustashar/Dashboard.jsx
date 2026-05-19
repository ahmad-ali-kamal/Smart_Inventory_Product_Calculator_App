/**
 * @file Dashboard.jsx
 * @module Pages/Mustashar
 *
 * The merchant overview page. Displays:
 *   - A setup banner when the calculator has not yet been configured.
 *   - Three stat cards: total products, activated count, and calculator settings preview.
 *   - A live table of active products with animated enter / exit transitions.
 *
 * Animation architecture (deactivation flow):
 *   When the merchant deactivates a product, React Query's optimistic update
 *   removes it from `activeProducts` immediately. Without intervention, Framer
 *   Motion's AnimatePresence would start collapsing the row in the same frame as
 *   the toggle click — before the Toggle thumb has finished sliding.
 *
 *   `useDeferredProducts` solves this with a two-phase exit:
 *     Phase 1 — `exiting: true` flag set immediately → ProductRow renders the
 *                row faded/gray with the toggle thumb moving to OFF.
 *     Phase 2 — After EXIT_FADE_MS + EXIT_ANIM_MS, the item is removed from
 *                the display list → AnimatePresence collapses the row height.
 *
 *   If the server rejects the toggle, React Query rolls back `active: true`,
 *   `activeProducts` re-includes the product, and the pending timers are cancelled
 *   — the row snaps back without any visual glitch.
 *
 * Used by: Inertia.js router (route: /mustashar/dashboard)
 */

import { useRef, useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, CheckCircle2, Pencil } from "lucide-react";
import useMustasharGuard from "../../Hooks/useMustasharGuard";
import PageShell from "../../Components/Common/PageShell";
import SetupBanner from "../../Components/Common/FeedBack/SetupBanner";
import StatCard from "../../Components/Common/StatCard";
import ProductRow from "../../Components/Mustashar/ProductRow";
import ProductTable from "../../Components/Mustashar/ProductTable";
import { useActiveProducts, useCalculatorSettings, useSettingsStatus } from "../../Hooks/useProducts";
import { useToggleWithToast } from "../../Hooks/useToggleWithToast";

// ── i18n strings ──────────────────────────────────────────────────────────────
// Move to your translation JSON and replace with useTranslation() when ready.
const t = {
    setup_banner_description: "Configure coverage per unit and waste percentage so the calculator can generate accurate results.",
    stat_total_label:         "Total Products",
    stat_total_sub:           "In your store",
    stat_activated_label:     "Activated",
    stat_activated_sub:       "Live on storefront",
    empty_state:              "No active products available",
};

// ── Exit timing constants ─────────────────────────────────────────────────────
/**
 * Duration (ms) that the faded/gray overlay is shown before Framer Motion
 * begins collapsing the row. Must exceed the Toggle CSS transition (250 ms)
 * so the thumb finishes sliding before the row shrinks.
 * @type {number}
 */
const EXIT_FADE_MS = 320;

/**
 * Duration (ms) of the Framer Motion height-collapse animation.
 * Keep in sync with the `exit` transition in AnimatedRow.
 * @type {number}
 */
const EXIT_ANIM_MS = 380;

// ── useCalcRules ──────────────────────────────────────────────────────────────
/**
 * Derives a display-ready array of calculator rule labels from the settings cache.
 * Returns an empty array while settings are loading so StatCard renders gracefully.
 *
 * @returns {{ label: string, value: string }[]}
 */
function useCalcRules() {
    const { data: settings } = useCalculatorSettings();
    if (!settings) return [];
    return [
        { label: "Coverage", value: `${Number(settings.coverage).toFixed(2)} m²` },
        { label: "Waste",    value: `${Number(settings.waste).toFixed(0)}% waste` },
    ];
}

// ── useDeferredProducts ───────────────────────────────────────────────────────
/**
 * Manages a display list of `{ product, exiting }` entries with two-phase
 * deferred exit logic so the toggle animation completes before the row collapses.
 *
 * Phase 1 (`exiting: true`, immediate):
 *   The product is removed from `activeProducts` by the optimistic update.
 *   We keep it in the display list and mark it `exiting: true`. ProductRow
 *   renders it faded/grayscale; the Toggle thumb slides to OFF.
 *
 * Phase 2 (removal, after EXIT_FADE_MS + EXIT_ANIM_MS):
 *   The item is dropped from the display list. AnimatePresence triggers the
 *   height-collapse animation in AnimatedRow.
 *
 * Rollback:
 *   If `activeProducts` re-includes a product (server error → React Query
 *   rolls back `active: true`), the pending timers are cancelled and the
 *   `exiting` flag is cleared. The row snaps back cleanly.
 *
 * @param {object[]} activeProducts - Live active-only product array from useActiveProducts.
 * @returns {{ product: object, exiting: boolean }[]}
 */
function useDeferredProducts(activeProducts) {
    // Each entry tracks the product data and whether it is in the exit window.
    const [displayList, setDisplayList] = useState(
        () => activeProducts.map((p) => ({ product: p, exiting: false })),
    );

    // productId → { phase1Timer, phase2Timer } — kept in a ref to avoid
    // stale closure issues inside setTimeout callbacks.
    const timers = useRef(new Map());

    useEffect(() => {
        const activeIds = new Set(activeProducts.map((p) => p.id));

        setDisplayList((prev) => {
            let next = prev;

            // ── Rollback: product came back → cancel pending timers ───────────
            for (const { product } of prev) {
                if (activeIds.has(product.id) && timers.current.has(product.id)) {
                    const { phase1Timer, phase2Timer } = timers.current.get(product.id);
                    clearTimeout(phase1Timer);
                    clearTimeout(phase2Timer);
                    timers.current.delete(product.id);
                    // Restore the active appearance.
                    next = next.map((entry) =>
                        entry.product.id === product.id
                            ? { ...entry, exiting: false }
                            : entry,
                    );
                }
            }

            // ── Phase 1: mark newly-departed rows as exiting ──────────────────
            for (const entry of next) {
                const id = entry.product.id;
                if (!activeIds.has(id) && !timers.current.has(id) && !entry.exiting) {
                    // Set the flag immediately so ProductRow fades out on this render.
                    next = next.map((e) =>
                        e.product.id === id ? { ...e, exiting: true } : e,
                    );

                    // Schedule Phase 2: remove from list after both windows expire.
                    const phase2Timer = setTimeout(() => {
                        timers.current.delete(id);
                        setDisplayList((cur) => cur.filter((e) => e.product.id !== id));
                    }, EXIT_FADE_MS + EXIT_ANIM_MS);

                    timers.current.set(id, { phase1Timer: null, phase2Timer });
                }
            }

            // ── New products: add immediately (e.g. after activation) ─────────
            const prevIds   = new Set(prev.map((e) => e.product.id));
            const additions = activeProducts
                .filter((p) => !prevIds.has(p.id))
                .map((p)    => ({ product: p, exiting: false }));

            if (additions.length > 0) {
                next = [...next, ...additions];
            }

            return next;
        });
    }, [activeProducts]);

    // Sync non-exiting rows when coverage or other product data changes in the cache.
    useEffect(() => {
        if (activeProducts.length === 0) return;
        const byId = new Map(activeProducts.map((p) => [p.id, p]));
        setDisplayList((prev) =>
            prev.map((entry) =>
                !entry.exiting && byId.has(entry.product.id)
                    ? { ...entry, product: byId.get(entry.product.id) }
                    : entry,
            ),
        );
    }, [activeProducts]);

    // Clear all timers on unmount to prevent setState calls on an unmounted component.
    useEffect(() => {
        return () => {
            for (const { phase1Timer, phase2Timer } of timers.current.values()) {
                clearTimeout(phase1Timer);
                clearTimeout(phase2Timer);
            }
        };
    }, []);

    return displayList;
}

// ── AnimatedRow ───────────────────────────────────────────────────────────────
/**
 * Wraps a ProductRow with Framer Motion enter / exit animations.
 * Measures the row's real pixel height at exit time so the collapse curve
 * is accurate rather than animating to `height: 0` from `height: "auto"`.
 *
 * The exit transition is delayed by EXIT_FADE_MS so the faded overlay phase
 * (rendered by ProductRow when `exiting=true`) is fully visible before the
 * row begins to shrink.
 *
 * @param {object}        props
 * @param {React.ReactNode} props.children - The ProductRow to animate.
 * @param {boolean}       props.exiting   - Passed through for future use; currently
 *                                          used by the parent to decide which children
 *                                          to render in exit state.
 *
 * @returns {JSX.Element}
 */
function AnimatedRow({ children, exiting }) {
    const ref       = useRef(null);
    // Cache the row height at the moment the exit animation starts.
    const heightRef = useRef(null);

    return (
        <motion.div
            ref={ref}
            style={{ overflow: "hidden" }}
            onAnimationStart={(def) => {
                // Capture the natural height just before Framer collapses it,
                // so the height animation has an accurate starting value.
                if (def === "exit" && ref.current) {
                    heightRef.current = ref.current.offsetHeight;
                }
            }}
            variants={{
                initial: { opacity: 0, height: 0 },
                animate: {
                    opacity:    1,
                    height:    "auto",
                    transition: { duration: 0.22, ease: "easeOut" },
                },
                exit: {
                    opacity: 0,
                    height:  heightRef.current ?? 0,
                    transition: {
                        // Delay the collapse until the faded overlay has been visible.
                        delay:   EXIT_FADE_MS / 1000,
                        opacity: { duration: 0.20, ease: "easeIn" },
                        height:  { duration: EXIT_ANIM_MS / 1000, ease: [0.4, 0, 0.2, 1] },
                    },
                },
            }}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {children}
        </motion.div>
    );
}

// Framer Motion variants for the empty-state message.
const emptyVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut", delay: 0.15 } },
    exit:    { opacity: 0, transition: { duration: 0.15 } },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
/**
 * Dashboard page component.
 *
 * @returns {JSX.Element}
 */
export default function Dashboard() {
    // Redirect unauthenticated or unauthorised visitors.
    useMustasharGuard();

    // Server state — full list and pre-filtered active subset.
    const { allProducts, activeProducts, isLoading, isError, error } = useActiveProducts();
    const { handleToggle, isPending, variables } = useToggleWithToast();
    const calcRules = useCalcRules();
    const { isLoading: settingsLoading, isConfigured } = useSettingsStatus();
    const needsSetup = !settingsLoading && !isConfigured;

    // The deferred display list — the single source of truth for the table.
    const displayList = useDeferredProducts(activeProducts);

    // The stat counter reflects the true server-confirmed active count immediately,
    // not the deferred display list (which may still contain exiting rows).
    const liveActiveCount = activeProducts.length;

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error}>
            <div className="space-y-6">

                {/* Setup prompt — shown only until the merchant saves settings once */}
                {needsSetup && (
                    <SetupBanner
                        href="/mustashar/settings"
                        description={t.setup_banner_description}
                    />
                )}

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Total product count */}
                    <StatCard
                        label={t.stat_total_label}
                        value={allProducts.length}
                        icon={<Package className="w-4 h-4" />}
                        sub={t.stat_total_sub}
                    />

                    {/* Activated (live) product count */}
                    <StatCard
                        label={t.stat_activated_label}
                        value={liveActiveCount}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        sub={t.stat_activated_sub}
                    />

                    {/* Calculator rules preview — edit icon links to settings page */}
                    <StatCard type="settings_preview" rules={calcRules}>
                        <Link href="/mustashar/settings">
                            <Pencil size={15} className="text-[var(--primary)]" />
                        </Link>
                    </StatCard>
                </div>

                {/* ── Active products table ── */}
                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden">
                    <ProductTable showPreview>
                        <AnimatePresence mode="popLayout">
                            {displayList.length > 0 ? (
                                /*
                                  `key="rows"` keeps this wrapper stable so AnimatePresence
                                  doesn't unmount and remount the entire list when switching
                                  between the rows and empty state.
                                  `initial={false}` suppresses the enter animation on first mount.
                                */
                                <motion.div key="rows" initial={false}>
                                    {displayList.map(({ product, exiting }) => (
                                        <AnimatedRow key={product.id} exiting={exiting}>
                                            <ProductRow
                                                product={product}
                                                onToggle={handleToggle}
                                                /*
                                                  Show loading state only on the row whose mutation
                                                  is currently in-flight (`variables` === this productId).
                                                */
                                                loading={isPending && variables === product.id}
                                                showPreview
                                                exiting={exiting}
                                            />
                                        </AnimatedRow>
                                    ))}
                                </motion.div>
                            ) : (
                                /* Animated empty state — fades in after the last row exits */
                                <motion.div
                                    key="empty"
                                    variants={emptyVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="py-20 text-center text-sm text-[var(--muted-foreground)] uppercase font-black tracking-widest opacity-40"
                                >
                                    {t.empty_state}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </ProductTable>
                </div>

            </div>
        </PageShell>
    );
}
