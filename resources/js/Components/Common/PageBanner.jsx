// resources/js/Components/Common/PageBanner.jsx
import { motion, AnimatePresence } from 'framer-motion';

export default function PageBanner({ children, visible, onToggle }) {
    return (
        <div className="flex items-center flex-1 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
                {visible ? (

                    <motion.div
                        key="open"
                        className="flex items-center gap-2 h-9 px-2 rounded-xl
                            bg-[var(--accent)] border border-[var(--primary)]/10
                            text-[var(--primary)] text-xs font-medium overflow-hidden"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        <button
                            onClick={onToggle}
                            className="w-5 h-5 flex items-center justify-center bg-white
                                rounded-full shadow-sm flex-shrink-0 text-[10px] font-black
                                text-[var(--primary)] hover:opacity-70 transition-opacity"
                        >
                            ℹ
                        </button>
                        <span className="pr-1">{children}</span>
                    </motion.div>

                ) : (

                    <motion.button
                        key="closed"
                        onClick={onToggle}
                        className="w-9 h-9 flex items-center justify-center flex-shrink-0
                            bg-[var(--accent)] border border-[var(--primary)]/10 rounded-xl
                            text-[var(--primary)] hover:opacity-70 transition-opacity"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <span className="w-5 h-5 flex items-center justify-center bg-white
                            rounded-full shadow-sm text-[10px] font-black text-[var(--primary)]">
                            ℹ
                        </span>
                    </motion.button>

                )}
            </AnimatePresence>
        </div>
    );
}