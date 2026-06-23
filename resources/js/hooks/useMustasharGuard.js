/**
 * @file useMustasharGuard.js
 * @module Hooks
 *
 * @description
 * Route-guard hook for all Mustashar pages.
 *
 * Responsibilities:
 *  - Redirect unauthenticated visitors to `/qiasat/login`.
 *  - Redirect first-time users (who haven't seen the onboarding instructions)
 *    to `/qiasat/instructions` before they can access any other Mustashar page.
 *  - Persist the "instructions seen" flag to `localStorage` when the server
 *    includes the `markInstructionsSeen` prop, ensuring the flag is written
 *    as early as possible — even before the Instructions page fully renders.
 *
 * Usage:
 * ```js
 * // Call at the top of any Mustashar page component.
 * useMustasharGuard();
 * ```
 *
 * The hook has no return value; it operates entirely via side-effects.
 */

import { useEffect } from "react";
import { usePage, router } from "@inertiajs/react";

/**
 * useMustasharGuard
 *
 * Enforces authentication and first-visit onboarding for all Mustashar routes.
 *
 * Guard flow (in order):
 *  1. If `auth.user` is absent → redirect to `/qiasat/login` and return early.
 *  2. If the `mustashar_seen_instructions` localStorage key is missing AND the
 *     current URL is not the instructions page → redirect there.
 *  3. If the user navigates directly to `/qiasat/instructions` (e.g. via the
 *     header link) while already having seen it → allow freely, no redirect.
 *
 * @returns {void} This hook produces no return value.
 */
export default function useMustasharGuard() {
    // ── Inertia page context ──────────────────────────────────────────────────
    const { props, url } = usePage();

    /**
     * `isAuthenticated` is truthy when the Inertia shared props contain a
     * logged-in user object. The guard uses this as the primary access gate.
     *
     * @type {Object|undefined}
     */
    const isAuthenticated = props.auth?.user;

    // ── Persist server-side "instructions seen" flag ──────────────────────────
    /**
     * When the server includes `markInstructionsSeen: true` in the page props
     * (typically set by the Instructions controller on successful render),
     * write the localStorage flag immediately — before any redirect logic runs —
     * so the flag is always persisted regardless of component render order.
     */
    useEffect(() => {
        if (props.markInstructionsSeen) {
            localStorage.setItem("mustashar_seen_instructions", "true");
        }
    }, [props.markInstructionsSeen]);

    // ── Route guard logic ─────────────────────────────────────────────────────
    useEffect(() => {
        // Gate 1: unauthenticated users go straight to login.
        if (!isAuthenticated) {
            router.visit("/qiasat/login");
            return;
        }

        const hasSeenInstructions = localStorage.getItem(
            "mustashar_seen_instructions",
        );
        const onInstructionsPage = url.includes("/qiasat/instructions");

        // Gate 2: new user (has not seen instructions yet) and not on the
        // instructions page → redirect to it so onboarding is never skipped.
        if (!hasSeenInstructions && !onInstructionsPage) {
            router.visit("/qiasat/instructions");
            return;
        }

        // Gate 3: existing user on the instructions page directly (via the header)
        // → allow them to continue freely; no redirect needed.
    }, [isAuthenticated, url]);
}
