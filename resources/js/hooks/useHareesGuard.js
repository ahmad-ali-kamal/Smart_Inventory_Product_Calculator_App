import { useEffect } from "react";
import { usePage, router } from "@inertiajs/react";

export default function useHareesGuard() {
    const { props, url } = usePage();
    const isAuthenticated = props.auth?.user;

    // Server-side instructions flag — save immediately prior to rendering
    if (props.markInstructionsSeen) {
        localStorage.setItem("harees_seen_instructions", "true");
    }

    useEffect(() => {
        if (!isAuthenticated) {
            router.visit("/harees/login");
            return;
        }

        const hasSeenInstructions = localStorage.getItem("harees_seen_instructions");
        const onInstructionsPage  = url.includes("/harees/instructions");

        // New user (has not seen instructions yet) and not on the instructions page → redirect to it
        if (!hasSeenInstructions && !onInstructionsPage) {
            router.visit("/harees/instructions");
            return;
        }

        // Existing user on the instructions page directly (via the header) → allow them to continue freely
        // No redirect — they can view it and return via the header at their discretion

    }, [isAuthenticated, url]);
}