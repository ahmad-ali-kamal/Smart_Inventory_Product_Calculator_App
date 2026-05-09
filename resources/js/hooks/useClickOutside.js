import { useEffect, useRef } from "react";

/**
 * Returns a ref. Calls onClose() whenever a click lands outside the element.
 * Usage: const ref = useClickOutside(() => setOpen(false));
 */
export function useClickOutside(onClose) {
    const ref = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);

    return ref;
}
