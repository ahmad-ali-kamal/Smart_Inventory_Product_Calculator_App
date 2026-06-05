export function getErrorMessage(error, t) {
    if (!error?.response) {
        return {
            heading: t('error_state.network_heading'),
            message: t('error_state.network_message'),
        };
    }

    const status = error.response.status;
    const detail = error.userMessage;

    if (status === 401 || status === 403) {
        return {
            heading: t('error_state.auth_heading'),
            message: detail || t('error_state.auth_message'),
        };
    }

    if (status === 404) {
        return {
            heading: t('error_state.not_found_heading'),
            message: detail || t('error_state.not_found_message'),
        };
    }

    if (status === 422) {
        return {
            heading: t('error_state.validation_heading'),
            message: detail || t('error_state.validation_message'),
        };
    }

    if (status === 429) {
        return {
            heading: t('error_state.rate_limit_heading'),
            message: detail || t('error_state.rate_limit_message'),
        };
    }

    if (status >= 500) {
        return {
            heading: t('error_state.server_error_heading'),
            message: detail || t('error_state.server_error_message'),
        };
    }

    return {
        heading: t('error_state.heading'),
        message: detail || t('error_state.default_message'),
    };
}
