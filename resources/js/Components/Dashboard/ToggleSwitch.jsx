import { useState } from 'react';

export default function ToggleSwitch({ defaultChecked = true, onChange }) {
    const [on, setOn] = useState(defaultChecked);

    const toggle = () => {
        const next = !on;
        setOn(next);
        onChange?.(next);
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={toggle}
            className={[
                'relative inline-flex w-11 h-6 rounded-full transition-colors duration-300 ease-out',
                on ? 'bg-violet-500' : 'bg-neutral-300',
            ].join(' ')}
        >
            <span
                className={[
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out',
                    on ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
            />
        </button>
    );
}
