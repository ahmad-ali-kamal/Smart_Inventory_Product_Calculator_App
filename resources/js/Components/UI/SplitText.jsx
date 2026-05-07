import { motion } from 'framer-motion';

/**
 * Animates each word of a text string with an upward slide-in.
 *
 * @param {string}  text
 * @param {object}  style       - Additional inline styles on the wrapper span
 * @param {number}  wordDelay   - Per-word stagger delay (seconds)
 * @param {number}  charDelay   - Fallback delay when stagger is disabled
 * @param {boolean} stagger     - Whether to stagger words
 */
export default function SplitText({
    text,
    style,
    wordDelay = 0.05,
    charDelay = 0.02,
    stagger = true,
}) {
    const words = text.split(' ');

    return (
        <span style={{ display: 'inline', ...style }}>
            {words.map((word, wi) => (
                <span
                    key={wi}
                    style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.22em' }}
                >
                    <motion.span
                        style={{ display: 'inline-block' }}
                        initial={{ y: '110%', opacity: 0 }}
                        animate={{ y: '0%', opacity: 1 }}
                        transition={{
                            duration: 0.65,
                            delay: stagger ? wi * wordDelay : charDelay,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
}