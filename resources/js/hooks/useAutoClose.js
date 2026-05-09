// resources/js/Hooks/useAutoClose.js
import { useState, useEffect } from 'react';

/**
 *
 * @param {number} delay 
 * @returns {[boolean, () => void]}
 */
export function useAutoClose(delay = 4000) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), delay);
        return () => clearTimeout(t);
    }, [delay]);

    const toggle = () => setVisible(v => !v);

    return [visible, toggle];
}