import { useLang } from "@/Hooks/useLang";

/**
 * Returns the correct heading + body font strings based on the active language.
 * Centralises the font logic so every component doesn't repeat the ternary.
 */
export function useFonts() {
    const { isAr } = useLang();

    return {
        ff: isAr ? "'Cairo', sans-serif" : "'Changa', sans-serif",
        bodyFont: "'Cairo', sans-serif",
    };
}
