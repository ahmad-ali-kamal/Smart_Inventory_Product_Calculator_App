/**
 * Global CSS injected once at the app root.
 * Kept in a dedicated file so Welcome.jsx stays clean
 * and styles can be reviewed / modified independently.
 */
const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Changa:wght@700;800&family=Cairo:wght@400;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { overflow-x: hidden; }

    /* Hero responsive */
    @media (max-width: 960px) {
        .q-hero-grid   { grid-template-columns: 1fr !important; }
        .q-hero-visual { display: none !important; }
        .q-hero-text   { align-items: center !important; text-align: center !important; }
        .q-hero-btns   { justify-content: center !important; }
    }

    /* Footer responsive */
    @media (max-width: 680px) {
        .q-footer-grid  { grid-template-columns: 1fr 1fr !important; }
        .q-footer-brand { grid-column: span 2 !important; }
    }
    @media (max-width: 400px) {
        .q-footer-grid  { grid-template-columns: 1fr !important; }
        .q-footer-brand { grid-column: auto !important; }
    }
`;

export default globalStyles;
