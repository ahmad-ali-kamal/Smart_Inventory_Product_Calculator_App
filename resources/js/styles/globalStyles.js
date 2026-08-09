/**
 * Global CSS injected once at the app root.
 * Kept in a dedicated file so Welcome.jsx stays clean
 * and styles can be reviewed / modified independently.
 */
// Note: fonts (Changa + Cairo) are loaded once via the <link> in
// resources/views/app.blade.php. They are intentionally NOT @import-ed here —
// a runtime @import inside an injected <style> fires late (FOUT risk) and
// duplicates a request the document <head> already makes.
const globalStyles = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    /* clip (not hidden): prevents the RTL scrollbar-gutter artifact where
       overflow-x:hidden on body/html adds the scrollbar width as left-side
       overflow on mobile, producing a horizontal white gap. Applied to html
       too because the artifact lives on the documentElement. */
    html, body { overflow-x: clip; }

    /* Brand background system */
    :root {
        --q-bg: #F8F7FF;
        --q-bg-alt: #F3F0FF;
        --q-card: #FFFFFF;
        --q-card-border: #EDE9FE;
        --q-card-shadow: 0 1px 4px rgba(124,58,237,0.06);
        --q-text: #1F2937;
        --q-text-muted: #6B7280;
        --q-accent: #7C3AED;
    }

    /* Hero responsive */
    @media (max-width: 960px) {
        .q-hero-grid   { grid-template-columns: 1fr !important; }
        .q-hero-visual { display: none !important; }
        .q-hero-text   { align-items: center !important; text-align: center !important; }
        .q-hero-btns   { justify-content: center !important; }
    }

    /* Hero: show visuals on tablet+ */
    @media (min-width: 640px) and (max-width: 960px) {
        .q-hero-visual { display: none !important; }
    }

    /* Footer responsive — 4 columns (brand + platforms + quick links + contact) */
    @media (max-width: 960px) {
        .q-footer-grid  { grid-template-columns: 1fr 1fr !important; }
        .q-footer-brand { grid-column: span 2 !important; }
    }
    @media (max-width: 540px) {
        .q-footer-grid  { grid-template-columns: 1fr !important; }
        .q-footer-brand { grid-column: auto !important; }
    }

    /* Scrollbar hide utility for mobile nav */
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
`;

export default globalStyles;
