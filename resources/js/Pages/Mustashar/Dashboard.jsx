import { useTranslation } from 'react-i18next';
import { useRef, useState, useEffect, useMemo } from "react";
import { Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, CheckCircle2, Pencil } from "lucide-react";
import useMustasharGuard from "../../Hooks/useMustasharGuard";
import PageShell from "../../Components/Common/PageShell";
import SetupBanner from "../../Components/Common/FeedBack/SetupBanner";
import StatCard from "../../Components/Common/StatCard";
import Pagination, { ITEMS_PER_PAGE } from "../../Components/Common/Controls/Pagination";
import ProductRow from "../../Components/Mustashar/ProductRow";
import ProductTable from "../../Components/Mustashar/ProductTable";
import { useActiveProducts, useMustasharSettings, useSettingsStatus } from "../../Hooks/useProducts";
import { useToggleWithToast } from "../../Hooks/useToggleWithToast";

const EXIT_FADE_MS = 320;
const EXIT_ANIM_MS = 380;

function useCalcRules() {
    const { t } = useTranslation('mustashar');
    const { data: settings } = useMustasharSettings();
    if (!settings) return [];
    return [
        { label: t('calc_rules.coverage_label'), value: `${Number(settings.coverage).toFixed(2)} m²` },
        { label: t('calc_rules.waste_label'),    value: `${Number(settings.waste).toFixed(0)}% waste` },
    ];
}

function useDeferredProducts(activeProducts) {
    const [displayList, setDisplayList] = useState(
        () => activeProducts.map((p) => ({ product: p, exiting: false })),
    );
    const timers = useRef(new Map());

    useEffect(() => {
        const activeIds = new Set(activeProducts.map((p) => p.id));
        setDisplayList((prev) => {
            let next = prev;
            for (const { product } of prev) {
                if (activeIds.has(product.id) && timers.current.has(product.id)) {
                    const { phase1Timer, phase2Timer } = timers.current.get(product.id);
                    clearTimeout(phase1Timer);
                    clearTimeout(phase2Timer);
                    timers.current.delete(product.id);
                    next = next.map((entry) =>
                        entry.product.id === product.id ? { ...entry, exiting: false } : entry,
                    );
                }
            }
            for (const entry of next) {
                const id = entry.product.id;
                if (!activeIds.has(id) && !timers.current.has(id) && !entry.exiting) {
                    next = next.map((e) =>
                        e.product.id === id ? { ...e, exiting: true } : e,
                    );
                    const phase2Timer = setTimeout(() => {
                        timers.current.delete(id);
                        setDisplayList((cur) => cur.filter((e) => e.product.id !== id));
                    }, EXIT_FADE_MS + EXIT_ANIM_MS);
                    timers.current.set(id, { phase1Timer: null, phase2Timer });
                }
            }
            const prevIds   = new Set(prev.map((e) => e.product.id));
            const additions = activeProducts
                .filter((p) => !prevIds.has(p.id))
                .map((p)    => ({ product: p, exiting: false }));
            if (additions.length > 0) next = [...next, ...additions];
            return next;
        });
    }, [activeProducts]);

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

function AnimatedRow({ children, exiting }) {
    const ref       = useRef(null);
    const heightRef = useRef(null);
    return (
        <motion.div
            ref={ref}
            style={{ overflow: "hidden" }}
            onAnimationStart={(def) => {
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

const emptyVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut", delay: 0.15 } },
    exit:    { opacity: 0, transition: { duration: 0.15 } },
};

export default function Dashboard() {
    const { t } = useTranslation('mustashar');
    useMustasharGuard();
  

    const { allProducts, activeProducts, isLoading, isError, error, refetch } = useActiveProducts();
    const { handleToggle, isPending, variables } = useToggleWithToast();
    const calcRules = useCalcRules();
    const { isLoading: settingsLoading, isConfigured } = useSettingsStatus();
    const needsSetup = !settingsLoading && !isConfigured;
    const displayList = useDeferredProducts(activeProducts);
    const liveActiveCount = activeProducts.length;

    // ── Pagination ──────────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    useEffect(() => { setPage(1); }, [activeProducts]);
    const totalPages = Math.max(1, Math.ceil(displayList.length / ITEMS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const paginatedList = useMemo(
        () => displayList.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
        [displayList, safePage],
    );

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-6">

                {needsSetup && (
                    <SetupBanner
                        href="/mustashar/settings"
                        description={t('dashboard.setup_banner_description')}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        label={t('dashboard.stat_total_label')}
                        value={allProducts.length}
                        icon={<Package className="w-4 h-4" />}
                        sub={t('dashboard.stat_total_sub')}
                    />
                    <StatCard
                        label={t('dashboard.stat_activated_label')}
                        value={liveActiveCount}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        sub={t('dashboard.stat_activated_sub')}
                    />
                    <StatCard type="settings_preview" rules={calcRules}>
                        <Link href="/mustashar/settings">
                            <Pencil size={15} className="text-[var(--primary)]" />
                        </Link>
                    </StatCard>
                </div>

                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden">
                    <ProductTable showPreview>
                        <AnimatePresence mode="popLayout">
                            {displayList.length > 0 ? (
                                <motion.div key="rows" initial={false}>
                                    {paginatedList.map(({ product, exiting }) => (
                                        <AnimatedRow key={product.id} exiting={exiting}>
                                            <ProductRow
                                                product={product}
                                                onToggle={handleToggle}
                                                loading={isPending && variables === product.id}
                                                showPreview
                                                exiting={exiting}
                                            />
                                        </AnimatedRow>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    variants={emptyVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="py-20 text-center text-sm text-[var(--muted-foreground)] uppercase font-black tracking-widest opacity-40"
                                >
                                    {t('dashboard.empty_state')}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </ProductTable>

                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>

            </div>
        </PageShell>
    );
}