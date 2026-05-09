import Reveal from '@/Components/ui/Reveal';

/**
 * Site footer with brand column + three link columns.
 *
 * @param {object} t        - Current language translations
 * @param {string} ff       - Heading font family string
 * @param {string} bodyFont - Body font family string
 */
export default function Footer({ t, ff, bodyFont }) {
    const { desc, product, company, support, copyright } = t.footer;
    const cols = [product, company, support];

    return (
        <footer
            id="stats"
            style={{
                background: '#ffffff',
                borderTop: '1px solid #E5E7EB',
                padding: '3rem 1.5rem 1.75rem',
                color: '#1A1A1A',
            }}
        >
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <Reveal>
                    <div
                        className="q-footer-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(160px, 220px) 1fr 1fr 1fr',
                            gap: '2rem',
                            marginBottom: '2.5rem',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* Brand column */}
                        <div className="q-footer-brand">
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                gap: 9, marginBottom: '0.75rem', direction: 'ltr',
                            }}>
                                <img src="/images/Quantix_logo.png" alt="Quantix" style={{ height: 36 }} />
                                <span style={{
                                    fontFamily: "'Changa', sans-serif",
                                    fontSize: '1.15rem', fontWeight: 800,
                                    letterSpacing: '0.08em', color: '#1A1A1A',
                                }}>
                                    QUANTIX
                                </span>
                            </div>
                            <p style={{
                                fontFamily: bodyFont,
                                fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.7,
                            }}>
                                {desc}
                            </p>
                        </div>

                        {/* Link columns */}
                        {cols.map((col, i) => (
                            <div key={i}>
                                <h4 style={{
                                    fontFamily: ff,
                                    fontSize: '0.7rem', fontWeight: 800,
                                    letterSpacing: '0.14em', color: '#9CA3AF',
                                    marginBottom: '1rem',
                                }}>
                                    {col.label}
                                </h4>
                                <ul style={{
                                    listStyle: 'none', padding: 0, margin: 0,
                                    display: 'flex', flexDirection: 'column', gap: 9,
                                }}>
                                    {col.links.map((link, li) => (
                                        <li key={li}>
                                            <a
                                                href="#"
                                                style={{
                                                    fontFamily: bodyFont,
                                                    fontSize: '0.84rem', color: '#4B5563',
                                                    textDecoration: 'none', transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
                                            >
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Reveal>

                <div style={{ height: 1, background: '#E5E7EB', marginBottom: '1.25rem' }} />
                <p style={{
                    textAlign: 'center',
                    fontFamily: bodyFont,
                    fontSize: '0.78rem', color: '#9CA3AF',
                }}>
                    {copyright}
                </p>
            </div>
        </footer>
    );
}