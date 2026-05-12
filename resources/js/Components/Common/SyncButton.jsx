// resources/js/Components/Common/SyncButton.jsx
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SyncButton({ endpoint, onSyncSuccess }) {
    const [isSyncing, setIsSyncing] = useState(false);

    const toastStyle = {
        borderRadius: "12px",
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        fontSize: "14px",
    };

   const handleSync = async () => {
    setIsSyncing(true);
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include',
        });

        const data = await res.json(); // ← أضف هذا

        if (!res.ok || !data.success) throw new Error('Sync failed');

        toast.success('Synced successfully!', { style: toastStyle });
        if (onSyncSuccess) setTimeout(() => onSyncSuccess(), 2000);
    } catch {
        toast.error('Sync failed.', { style: toastStyle });
    } finally {
        setIsSyncing(false);
    }
};

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing}
            className="h-9 w-9 rounded-xl bg-[var(--accent)] text-[var(--primary)] hover:opacity-80 transition-opacity flex items-center justify-center border border-[var(--primary)]/5 flex-shrink-0"
            title="Sync Data"
        >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
        </button>
    );
}