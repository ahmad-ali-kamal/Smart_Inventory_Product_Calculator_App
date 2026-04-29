import { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';

export default function useHareesGuard() {
    const { props, url } = usePage();
    const isAuthenticated = props.auth?.user;

    useEffect(() => {
        if (!isAuthenticated) {
            router.visit('/harees/login');
            return;
        }

        const hasSeenInstructions = localStorage.getItem('harees_seen_instructions');
        const isOnInstructions = url === '/harees/instructions';

        if (!hasSeenInstructions && !isOnInstructions) {
            router.visit('/harees/instructions');
        }
    }, [isAuthenticated, url]);
}
