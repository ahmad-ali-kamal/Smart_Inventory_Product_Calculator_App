import { useEffect } from "react";
import { usePage, router } from "@inertiajs/react";

export default function useMustasharGuard() {
    const { props, url } = usePage();
    const isAuthenticated = props.auth?.user;

    useEffect(() => {
        if (!isAuthenticated) {
            router.visit("/mustashar/login");
            return;
        }

        const isOnInstructions = url === "/mustashar/instructions";

        // لو المستخدم على صفحة الإنستركشنز، نحفظ الـ flag تلقائياً
        if (isOnInstructions) {
            localStorage.setItem("mustashar_seen_instructions", "true");
            return;
        }

        const hasSeenInstructions = localStorage.getItem(
            "mustashar_seen_instructions",
        );

        if (!hasSeenInstructions) {
            router.visit("/mustashar/instructions");
        }
    }, [isAuthenticated, url]);
}
