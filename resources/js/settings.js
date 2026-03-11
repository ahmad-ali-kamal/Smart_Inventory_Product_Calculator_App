/**
 * settings.js
 * JS خاص بصفحة الإعدادات — live preview للحسابات
 */
document.addEventListener('DOMContentLoaded', function () {
    const coverageInput = document.getElementById('coverage_per_unit');
    const wasteInput    = document.getElementById('waste_percentage');
    const placeholder   = document.getElementById('preview-placeholder');
    const resultBlock   = document.getElementById('preview-result');
    const formulaLine   = document.getElementById('formula-line');
    const varRows       = document.getElementById('var-rows');
    const resultNumber  = document.getElementById('result-number');
    const AREA = 20;

    function varRow(name, value) {
        return `<div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="font-family:'Courier New',monospace; font-size:0.72rem; font-weight:700; color:var(--mauve-deep); background:var(--mauve-soft); border:1px solid var(--mauve-border); border-radius:2rem; padding:0.15rem 0.7rem; min-width:72px; text-align:center;">${name}</span>
            <span style="font-size:0.72rem; color:var(--muted);">=</span>
            <span style="font-size:0.78rem; font-weight:600; color:var(--fg);">${value}</span>
        </div>`;
    }

    function updatePreview() {
        const coverage = parseFloat(coverageInput.value);
        const waste    = parseFloat(wasteInput.value);

        if (!coverage || !waste || coverage <= 0) {
            placeholder.style.display = 'block';
            resultBlock.style.display = 'none';
            return;
        }

        const wasteDecimal = waste / 100;
        const boxes        = Math.ceil((AREA / coverage) * (1 + wasteDecimal));

        formulaLine.innerHTML = `boxes = ceil( <span style="color:var(--mauve-deep);font-weight:700;">area</span> &divide; <span style="color:var(--mauve-deep);font-weight:700;">coverage</span> &times; (1 + <span style="color:var(--mauve-deep);font-weight:700;">waste</span>) )`;
        varRows.innerHTML     = varRow('area', `${AREA} m²`) + varRow('coverage', `${coverage} m² per box`) + varRow('waste', `${wasteDecimal.toFixed(2)} (${waste}%)`);
        resultNumber.textContent = boxes;

        placeholder.style.display = 'none';
        resultBlock.style.display = 'flex';
    }

    if (coverageInput.value && wasteInput.value) updatePreview();
    coverageInput.addEventListener('input', updatePreview);
    wasteInput.addEventListener('input',    updatePreview);
});