// resources/js/Components/Common/AppToaster.jsx
import { Toaster } from 'react-hot-toast';

/**
 * AppToaster
 * Mount this ONCE in your root Layout component.
 * Do NOT add <Toaster> anywhere else — duplicate mounts cause
 * toasts to appear both top and bottom simultaneously.
 *
 * Usage in Layout.jsx:
 *   import AppToaster from '../Components/Common/AppToaster';
 *   ...
 *   <AppToaster />
 */
export default function AppToaster() {
    return (
        <Toaster
            position="bottom-center"
            containerStyle={{ bottom: 28 }}
            toastOptions={{ duration: 3000 }}
        />
    );
}