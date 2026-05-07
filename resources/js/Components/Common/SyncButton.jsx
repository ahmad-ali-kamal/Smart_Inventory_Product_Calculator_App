// resources/js/Components/Common/SyncButton.jsx
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

export default function SyncButton({ endpoint, onSyncSuccess }) {
    const [isSyncing, setIsSyncing] = useState(false);

    // الستايل الموحد للتوست ليدعم الثيمين
    const toastStyle = {
        borderRadius: "12px",
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        fontSize: "14px",
    };

    const handleSync = () => {
        setIsSyncing(true);
        router.post(endpoint, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Synced successfully!', { style: toastStyle });
                if (onSyncSuccess) onSyncSuccess(); // لتحديث البيانات في الصفحة الأم[cite: 11]
            },
            onError: () => {
                toast.error('Sync failed.', { style: toastStyle });
            },
            onFinish: () => setIsSyncing(false)
        });
    };

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 hover:bg-[var(--secondary)] rounded-full border border-[var(--border)] transition-all flex items-center justify-center"
            title="Sync Data"
        >
            <RefreshCw className={`w-4 h-4 text-[var(--muted-foreground)] ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
    );
}