import { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';

export default function useMustasharGuard() {
    const { props, url } = usePage();
    const isAuthenticated = props.auth?.user;

    useEffect(() => {
        if (!isAuthenticated) {
            router.visit('/mustashar/login');
            return;
        }

        const hasSeenInstructions = localStorage.getItem('mustashar_seen_instructions');
        const isOnInstructions = url === '/mustashar/instructions';

        if (!hasSeenInstructions && !isOnInstructions) {
            router.visit('/mustashar/instructions');
        }
    }, [isAuthenticated, url]);
}
