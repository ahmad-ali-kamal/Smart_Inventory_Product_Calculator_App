/**
 * @file getErrorMessage.js
 * @module utils
 *
 * Single source of truth for turning a normalised axios/React Query error into
 * the `{ heading, message }` pair rendered by <ErrorState>.
 *
 * Relies on the shape attached by the `apiClient` response interceptor:
 *   error.status, error.userMessage, error.validationErrors,
 *   error.isTimeout, error.isNetworkError.
 *
 * Heading strategy (Requirement 1 — context-aware):
 *   When a `context` is supplied, the heading is always
 *   "Failed to load <context>" (e.g. "Failed to load products"), regardless of
 *   status — no page falls back to a generic "Something went wrong".
 *   When no context is supplied (standalone usage), a status-specific heading
 *   is used instead.
 *
 * Message strategy (Requirement 4 — priority order):
 *   1. 422 → joined field-level validation messages from Laravel's `errors` bag.
 *   2. error.userMessage (Laravel `data.message`), when present.
 *   3. A translated string keyed by HTTP status code.
 *   4. A translated generic fallback.
 */

/**
 * Flattens Laravel's validation bag ({ field: ["msg1", "msg2"] }) into a single
 * human-readable string. Returns null when there is nothing usable.
 *
 * @param {Object|null} bag
 * @returns {string|null}
 */
function flattenValidationErrors(bag) {
    if (!bag || typeof bag !== "object") return null;
    const messages = Object.values(bag)
        .flat()
        .filter((m) => typeof m === "string" && m.trim() !== "");
    return messages.length ? messages.join(" ") : null;
}

/**
 * @param {Object}   error      Normalised error from apiClient (or null).
 * @param {Function} t          i18next `t` bound to the 'shared' namespace.
 * @param {string}   [context]  Page context key (e.g. 'products', 'settings',
 *                              'dashboard'). Drives the context-aware heading.
 * @returns {{ heading: string, message: string }}
 */
export function getErrorMessage(error, t, context) {
    // Context-aware heading: "Failed to load <translated context>".
    // Falls back to a generic "page" label so the template always reads well.
    const contextHeading = context
        ? t("error_state.load_failed", {
              context: t(`error_state.context.${context}`, {
                  defaultValue: t("error_state.context.page"),
              }),
          })
        : null;

    const status = error?.status ?? error?.response?.status ?? null;
    const detail = error?.userMessage ?? null;

    // ── No response: network failure or timeout ──────────────────────────────
    if (!error?.response) {
        if (error?.isTimeout) {
            return {
                heading: contextHeading ?? t("error_state.timeout_heading"),
                message: t("error_state.timeout_message"),
            };
        }
        return {
            heading: contextHeading ?? t("error_state.network_heading"),
            message: t("error_state.network_message"),
        };
    }

    // ── 422: surface actual field-level validation messages ──────────────────
    if (status === 422) {
        const fieldMessages =
            flattenValidationErrors(error.validationErrors) ?? detail;
        return {
            heading: contextHeading ?? t("error_state.validation_heading"),
            message: fieldMessages || t("error_state.validation_message"),
        };
    }

    if (status === 401 || status === 403) {
        return {
            heading: contextHeading ?? t("error_state.auth_heading"),
            message: t("error_state.auth_message"),
        };
    }

    if (status === 404) {
        return {
            heading: contextHeading ?? t("error_state.not_found_heading"),
            message: t("error_state.not_found_message"),
        };
    }

    if (status === 429) {
        return {
            heading: contextHeading ?? t("error_state.rate_limit_heading"),
            message: t("error_state.rate_limit_message"),
        };
    }

    if (status >= 500) {
        return {
            heading: contextHeading ?? t("error_state.server_error_heading"),
            message: t("error_state.server_error_message"),
        };
    }

    return {
        heading: contextHeading ?? t("error_state.heading"),
        message: t("error_state.default_message"),
    };
}
