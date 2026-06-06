import axios from "axios";

/**
 * Shared axios instance for every JSON/AJAX request in the app.
 *
 * `X-Requested-With` makes Laravel treat the request as AJAX and return JSON
 * error bodies (instead of HTML redirects), which is what the response
 * interceptor below relies on to extract a user-facing message.
 *
 * A finite `timeout` guarantees that a hung connection eventually rejects with
 * `code === "ECONNABORTED"` rather than spinning forever, so the UI can show a
 * proper timeout error state.
 */
const apiClient = axios.create({
    baseURL: "/",
    withCredentials: true,
    timeout: 20_000,
    headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

/**
 * Centralised error transformation.
 *
 * Every rejected response is normalised into a predictable shape *before* it
 * reaches React Query or any component, so downstream code never has to dig
 * through `error.response.data.*` again:
 *
 *   error.status           {number|null}  HTTP status (null for network/timeout).
 *   error.userMessage      {string|null}  Human-readable message from Laravel
 *                                          (`data.message`), when present.
 *   error.validationErrors {object|null}  Laravel 422 field bag
 *                                          (`data.errors`: { field: string[] }).
 *   error.isTimeout        {boolean}      True when the request aborted on timeout.
 *   error.isNetworkError   {boolean}      True when no response was received.
 *
 * Keeping this in one interceptor (rather than per-hook) is what makes the
 * error object "consistently shaped" across both the Harees and Mustashar
 * features — the single requirement that the previous per-hook axios instances
 * violated.
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const data = error.response?.data;

        error.status = error.response?.status ?? null;
        error.userMessage =
            typeof data?.message === "string" ? data.message : null;
        error.validationErrors =
            data?.errors && typeof data.errors === "object" ? data.errors : null;
        error.isTimeout = error.code === "ECONNABORTED";
        error.isNetworkError = !error.response;

        return Promise.reject(error);
    },
);

export default apiClient;
