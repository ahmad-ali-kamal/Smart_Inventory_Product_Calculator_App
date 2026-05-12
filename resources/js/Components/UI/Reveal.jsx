import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Wraps children in a scroll-triggered fade + slide animation.
 *
 * @param {React.ReactNode} children
 * @param {number}          delay     - Stagger delay in seconds
 * @param {'up'|'down'|'left'|'right'} direction
 */
export default function Reveal({ children, delay = 0, direction = 'up' }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px 0px' });

    const variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up'   ? 32 : direction === 'down'  ? -32 : 0,
            x: direction === 'left' ? 32 : direction === 'right' ? -32 : 0,
        },
        visible: { opacity: 1, y: 0, x: 0 },
    };

    return (
        <motion.div
            ref={ref}
            variants={variants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}