import { useEffect } from "react";
import { usePage, router } from "@inertiajs/react";

export default function useHareesGuard() {
    const { props, url } = usePage();
    const isAuthenticated = props.auth?.user;

    useEffect(() => {
        if (!isAuthenticated) {
            router.visit("/harees/login");
            return;
        }

        const isOnInstructions = url === "/harees/instructions";

        // لو المستخدم على صفحة الإنستركشنز، نحفظ الـ flag تلقائياً
        if (isOnInstructions) {
            localStorage.setItem("harees_seen_instructions", "true");
            return;
        }

        const hasSeenInstructions = localStorage.getItem(
            "harees_seen_instructions",
        );

        if (!hasSeenInstructions) {
            router.visit("/harees/instructions");
        }
    }, [isAuthenticated, url]);
}
