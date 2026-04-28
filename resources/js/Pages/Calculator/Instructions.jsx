// resources/js/Pages/Calculator/Instructions.jsx
import { router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import Card from '../../Components/UI/Card';
import { Calculator, SlidersHorizontal, ToggleRight, BarChart2 } from 'lucide-react';

const steps = [
    {
        number: 'Step One',
        title: 'General Settings',
        description: 'Define your coverage per unit and waste percentage to power the calculation engine.',
        tags: ['Coverage per unit (m²)', 'Waste percentage (%)'],
        icon: <SlidersHorizontal className="w-5 h-5 text-[var(--primary)]" />,
        action: { label: 'Open Settings →', to: '/settings' },
    },
    {
        number: 'Step Two',
        title: 'Activate Products',
        description: 'Select which products use the smart calculator from your product catalogue.',
        tags: ['Toggle products on or off', 'Filter by category'],
        icon: <ToggleRight className="w-5 h-5 text-[var(--primary)]" />,
        action: { label: 'Go to Products →', to: '/products' },
    },
    {
        number: 'Step Three',
        title: 'Daily Management',
        description: 'Manage active products and edit calculation settings anytime from the dashboard.',
        tags: ['Live overview from Dashboard', 'Edit settings at any time'],
        icon: <BarChart2 className="w-5 h-5 text-[var(--primary)]" />,
        action: { label: 'View Dashboard →', to: '/dashboard' },
    },
];

export default function Instructions() {
    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-[#5C5A9E] to-[#3D3B7A] p-10 text-white text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
                        <Calculator className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-semibold mb-2">Calculator Tool</h1>
                    <p className="text-white/70 text-sm max-w-sm mx-auto">
                        Smart product calculator for e-commerce — built for precision and simplicity.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                        {['3 Steps', 'Easy Setup', 'Live Preview'].map((tag) => (
                            <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/15 text-white/90 border border-white/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <Card className="p-5 flex items-start gap-3">
                    <span className="text-[var(--primary)] mt-0.5">✦</span>
                    <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">Three simple steps to get started</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                            Turn measurements into instant orders. Set up once and let the smart engine handle all the complex calculations for you.
                        </p>
                    </div>
                </Card>

                {steps.map((step) => (
                    <Card key={step.number} className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                                {step.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                            {step.number}
                                        </span>
                                        <h3 className="text-base font-semibold text-[var(--foreground)] mt-2">{step.title}</h3>
                                        <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-sm">{step.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {step.tags.map((tag) => (
                                                <span key={tag} className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.visit(step.action.to)}
                                        className="text-sm text-[var(--foreground)] border border-[var(--border)] px-4 py-2 rounded-full hover:bg-[var(--accent)] transition-colors whitespace-nowrap flex-shrink-0"
                                    >
                                        {step.action.label}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                <button
                    onClick={() => router.visit('/dashboard')}
                    className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    Go to Dashboard →
                </button>

                <p className="text-center text-xs text-[var(--muted-foreground)]">
                    Quantix Smart Calculator · Set up your rules once and automate product calculations across your store.
                </p>
            </div>
        </Layout>
    );
}