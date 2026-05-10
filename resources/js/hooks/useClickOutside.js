import { useEffect, useRef } from "react";

export function useClickOutside(onClose) {
    const ref         = useRef(null);
    const callbackRef = useRef(onClose);

    useEffect(() => {
        callbackRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                callbackRef.current();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return ref;
}