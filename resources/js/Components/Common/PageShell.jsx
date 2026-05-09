// Components/Common/PageShell.jsx
import Layout from '../../Layouts/Layout';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import ErrorBoundary from './ErrorBoundary';

export default function PageShell({ isLoading, isError, error, onRetry, children }) {
    if (isLoading) {
        return <Layout><LoadingState /></Layout>;
    }

    if (isError) {
        return (
            <Layout>
                <ErrorState
                    message={error?.message ?? 'Something went wrong.'}
                    onRetry={onRetry}
                />
            </Layout>
        );
    }

    return (
        <Layout>
            <ErrorBoundary>
                {children}
            </ErrorBoundary>
        </Layout>
    );
}