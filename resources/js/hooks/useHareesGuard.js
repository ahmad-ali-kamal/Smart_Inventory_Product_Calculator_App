/**
 * @file useHareesGuard.js
 * @module Hooks
 *
 * @description
 * Route-guard hook for all Harees pages.
 *
 * Responsibilities:
 *  - Redirect unauthenticated visitors to `/harees/login`.
 *  - Redirect first-time users (who haven't seen the onboarding instructions)
 *    to `/harees/instructions` before they can access any other Harees page.
 *  - Persist the "instructions seen" flag to `localStorage` both on the
 *    Instructions page itself (via the `markInstructionsSeen` server prop)
 *    and when the component mounts with that prop set, ensuring the flag is
 *    written even if the effect fires before the Instructions page renders.
 *
 * Usage:
 * ```js
 * // Call at the top of any Harees page component.
 * useHareesGuard();
 * ```
 *
 * The hook has no return value; it operates entirely via side-effects.
 */

import { useEffect } from "react";
import { usePage, router } from "@inertiajs/react";

/**
 * useHareesGuard
 *
 * Enforces authentication and first-visit onboarding for all Harees routes.
 *
 * Guard flow (in order):
 *  1. If `auth.user` is absent → redirect to `/harees/login` and return early.
 *  2. If the `harees_seen_instructions` localStorage key is missing AND the
 *     current URL is not the instructions page → redirect there.
 *  3. If the user navigates directly to `/harees/instructions` (e.g. via the
 *     header link) while already having seen it → allow freely, no redirect.
 *
 * @returns {void} This hook produces no return value.
 */
export default function useHareesGuard() {
    // ── Inertia page context ──────────────────────────────────────────────────
    const { props, url } = usePage();

    /**
     * `isAuthenticated` is truthy when the Inertia shared props contain a
     * logged-in user object.  The guard uses this as the primary access gate.
     *
     * @type {Object|undefined}
     */
    const isAuthenticated = props.auth?.user;

    // ── Persist server-side "instructions seen" flag ──────────────────────────
    /**
     * When the server includes `markInstructionsSeen: true` in the page props
     * (set by the Instructions controller), write the localStorage flag
     * immediately — before any redirect logic runs — so the flag is always
     * persisted regardless of component render order.
     */
    useEffect(() => {
        if (props.markInstructionsSeen) {
            localStorage.setItem("harees_seen_instructions", "true");
        }
    }, [props.markInstructionsSeen]);

    // ── Route guard logic ─────────────────────────────────────────────────────
    useEffect(() => {
        // Gate 1: unauthenticated users go straight to login.
        if (!isAuthenticated) {
            router.visit("/harees/login");
            return;
        }

        const hasSeenInstructions = localStorage.getItem("harees_seen_instructions");
        const onInstructionsPage  = url.includes("/harees/instructions");

        // Gate 2: new user (has not seen instructions yet) and not on the
        // instructions page → redirect to it so onboarding is never skipped.
        if (!hasSeenInstructions && !onInstructionsPage) {
            router.visit("/harees/instructions");
            return;
        }

        // Gate 3: existing user on the instructions page directly (via the header)
        // → allow them to continue freely; no redirect needed.

    }, [isAuthenticated, url]);
}