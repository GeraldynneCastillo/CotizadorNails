// Data Store for Services (@NailsStudio Pricing)
const servicesData = {
    baseServices: [
        { id: 'esmaltado-permanente', name: 'Esmaltado Permanente', desc: 'Manicure básica', price: 15000 },
        { id: 'acrilicas-sm', name: 'Acrílicas Talla S, M', desc: 'Extensión tamaño corto/medio', price: 25000 },
        { id: 'acrilicas-l', name: 'Acrílicas Talla L', desc: 'Extensión tamaño largo', price: 30000 },
        { id: 'acrilicas-xl', name: 'Acrílicas Talla XL', desc: 'Extensión tamaño extra largo', price: 35000 },
        { id: 'kapping', name: 'Kapping', desc: 'Reforzamiento de uña', price: 17000 },
        { id: 'retiro-acrilicas', name: 'Retiro Acrílicas', desc: 'Retiro cuidadoso', price: 7000 },
        { id: 'retiro-esmaltado', name: 'Retiro Esmaltado P.', desc: 'Retiro de esmaltado permanente', price: 6000 }
    ],
    extras: [
        { id: 'nail-art-avanzado', name: 'Nail Art (avanzado) c/u', price: 2000 },
        { id: 'nail-art-intermedio', name: 'Nail Art (Intermedio) c/u', price: 1000 },
        { id: 'nail-art-facil', name: 'Nail Art (Fácil) c/u', price: 500 },
        { id: 'encapsulados', name: 'Encapsulados c/u', price: 500 }
    ]
};

// Formatter for CLP
const formatCLP = (price) => {
    return new Intl.NumberFormat('es-CL').format(price);
};

// State
const state = {
    selectedBase: null, // item del objeto
    selectedExtras: {} // objeto con { 'ext-id': quantity }
};

// DOM Elements
const baseServicesContainer = document.getElementById('base-services');
const extraServicesContainer = document.getElementById('extra-services');
const summaryList = document.getElementById('summary-list');
const summaryEmpty = document.getElementById('summary-empty');
const totalPriceEl = document.getElementById('total-price');
const btnPdf = document.getElementById('btn-pdf');

// Initialize
function init() {
    renderBaseServices();
    renderExtras();
    attachListeners();
}

// Render Base Services
function renderBaseServices() {
    let html = '';
    servicesData.baseServices.forEach(srv => {
        html += `
            <label class="service-card" for="base-${srv.id}">
                <input type="radio" name="base_service" id="base-${srv.id}" value="${srv.id}">
                <div class="service-card-content">
                    <div class="service-name">${srv.name}</div>
                    <div class="service-desc">${srv.desc}</div>
                    <div class="service-price">$${formatCLP(srv.price)}</div>
                </div>
            </label>
        `;
    });
    baseServicesContainer.innerHTML = html;
}

// Render Extras with Quantity Selectors
function renderExtras() {
    let html = '';
    servicesData.extras.forEach(ext => {
        state.selectedExtras[ext.id] = 0; // initialize quantity to 0
        html += `
            <div class="check-item has-qty">
                <div class="check-info">
                    <span class="check-name">${ext.name}</span>
                    <span class="check-price">+$${formatCLP(ext.price)}</span>
                </div>
                <div class="qty-selector">
                    <button class="qty-btn" onclick="updateQty('${ext.id}', -1)">-</button>
                    <span class="qty-val" id="qty-${ext.id}">0</span>
                    <button class="qty-btn" onclick="updateQty('${ext.id}', 1)">+</button>
                </div>
            </div>
        `;
    });
    extraServicesContainer.innerHTML = html;
}

// Global Quantity Update function
window.updateQty = function (id, change) {
    let currentQty = state.selectedExtras[id];
    let newQty = currentQty + change;

    // limit bounds exactly: 0 to 10 max
    if (newQty < 0) newQty = 0;
    if (newQty > 10) newQty = 10;

    state.selectedExtras[id] = newQty;
    document.getElementById(`qty-${id}`).textContent = newQty;

    updateSummary();
};

// Attach Event Listeners
function attachListeners() {
    // Escuchar cambios en Base Services
    const baseRadios = document.querySelectorAll('input[name="base_service"]');
    baseRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            state.selectedBase = servicesData.baseServices.find(s => s.id === selectedId);
            updateSummary();
        });
    });

    // Generar PDF
    btnPdf.addEventListener('click', generatePDF);
}

// Update Summary Panel
function updateSummary() {
    const hasExtras = Object.values(state.selectedExtras).some(qty => qty > 0);

    if (!state.selectedBase && !hasExtras) {
        summaryEmpty.style.display = 'block';
        summaryList.innerHTML = '';
        totalPriceEl.textContent = '$0';
        return;
    }

    summaryEmpty.style.display = 'none';
    let html = '';
    let total = 0;

    // Add Base Service
    if (state.selectedBase) {
        html += `
            <li class="summary-item">
                <span>${state.selectedBase.name}</span>
                <span>$${formatCLP(state.selectedBase.price)}</span>
            </li>
        `;
        total += state.selectedBase.price;
    }

    // Add Extras
    servicesData.extras.forEach(ext => {
        const qty = state.selectedExtras[ext.id];
        if (qty > 0) {
            const extTotal = qty * ext.price;
            html += `
                <li class="summary-item">
                    <span>+ ${qty}x ${ext.name}</span>
                    <span>$${formatCLP(extTotal)}</span>
                </li>
            `;
            total += extTotal;
        }
    });

    // Render
    summaryList.innerHTML = html;

    // Animate Price Change
    const prevTotalText = totalPriceEl.textContent;
    // Extract numbers, remove dots
    const prevTotal = parseInt(prevTotalText.replace(/\D/g, '')) || 0;
    animateValue(totalPriceEl, prevTotal, total, 300);
}

// Price Animation
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        obj.innerHTML = '$' + formatCLP(currentVal);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Animación pop sutil
            obj.style.transform = 'scale(1.1)';
            setTimeout(() => { obj.style.transform = 'scale(1)'; }, 100);
        }
    };
    window.requestAnimationFrame(step);
}

// PDF Generator — usa jsPDF directamente (sin capturas de pantalla)
function generatePDF() {
    const hasExtras = Object.values(state.selectedExtras).some(qty => qty > 0);

    if (!state.selectedBase && !hasExtras) {
        // Mostrar toast bonito en lugar del alert feo
        const toast = document.getElementById('toast-error');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
        return;
    }

    // Feedback visual del botón
    btnPdf.style.opacity = '0.7';
    btnPdf.innerHTML = '<i class="ph ph-spinner-gap"></i> Generando...';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ─── COLORES ────────────────────────────────────────
    const PINK = [255, 117, 140];
    const GOLD = [201, 150, 58];
    const DARK = [40, 40, 40];
    const GRAY = [100, 100, 100];
    const LGRAY = [220, 220, 220];
    const ROSE = [252, 228, 236];

    // ─── HEADER ROSA ─────────────────────────────────────
    doc.setFillColor(...PINK);
    doc.rect(0, 0, pageW, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('@NailsStudio', pageW / 2, 17, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 215, 225);
    doc.text('MANICURE & NAIL ART', pageW / 2, 25, { align: 'center' });

    y = 48;

    // ─── TÍTULO ──────────────────────────────────────────
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Cotizacion Estimada', pageW / 2, y, { align: 'center' });
    y += 3;
    doc.setDrawColor(...PINK);
    doc.setLineWidth(0.6);
    doc.line(margin + 25, y, pageW - margin - 25, y);
    y += 9;

    // ─── CABECERA TABLA ──────────────────────────────────
    doc.setFillColor(...ROSE);
    doc.rect(margin, y, contentW, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text('SERVICIO', margin + 4, y + 6);
    doc.text('PRECIO (CLP)', pageW - margin - 4, y + 6, { align: 'right' });
    doc.setDrawColor(...PINK);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 9, pageW - margin, y + 9);
    y += 9;

    // ─── FILAS SERVICIOS ─────────────────────────────────
    let total = 0;
    const items = [];

    if (state.selectedBase) {
        items.push({ name: state.selectedBase.name, price: state.selectedBase.price });
        total += state.selectedBase.price;
    }
    servicesData.extras.forEach(ext => {
        const qty = state.selectedExtras[ext.id];
        if (qty > 0) {
            items.push({ name: qty + 'x ' + ext.name, price: qty * ext.price });
            total += qty * ext.price;
        }
    });

    const rowH = 10;
    items.forEach((item, i) => {
        if (i % 2 === 0) {
            doc.setFillColor(250, 250, 252);
            doc.rect(margin, y, contentW, rowH, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...DARK);
        doc.text(item.name, margin + 4, y + 7);
        doc.text('$' + formatCLP(item.price), pageW - margin - 4, y + 7, { align: 'right' });
        doc.setDrawColor(...LGRAY);
        doc.setLineWidth(0.2);
        doc.line(margin, y + rowH, pageW - margin, y + rowH);
        y += rowH;
    });

    y += 7;

    // ─── CAJA TOTAL ──────────────────────────────────────
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.setFillColor(255, 252, 240);
    doc.roundedRect(margin, y, contentW, 14, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text('Total Estimado', margin + 6, y + 9);
    doc.setFontSize(13);
    doc.setTextColor(...GOLD);
    doc.text('$' + formatCLP(total) + ' CLP', pageW - margin - 6, y + 9.5, { align: 'right' });

    y += 22;

    // ─── NOTA ────────────────────────────────────────────
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 15, 2, 2, 'FD');
    doc.setFillColor(...PINK);
    doc.rect(margin, y, 2, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('* Nota:', margin + 6, y + 5.5);
    doc.setFont('helvetica', 'normal');
    const nota = 'Esta cotizacion es referencial. Los precios en CLP pueden variar segun la complejidad del diseno en el estudio.';
    const splitNota = doc.splitTextToSize(nota, contentW - 12);
    doc.text(splitNota, margin + 6, y + 11);

    y += 22;

    // ─── FECHA Y PIE ─────────────────────────────────────
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-CL', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('Generado el: ' + fecha, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.text('Te esperamos! @NailsStudio', pageW / 2, y, { align: 'center' });

    // ─── DESCARGAR ───────────────────────────────────────
    doc.save('Cotizacion-NailsStudio.pdf');

    // Limpiar calculadora después de descargar
    resetCalculator();

    // Restaurar botón
    btnPdf.style.opacity = '1';
    btnPdf.innerHTML = '<i class="ph ph-file-pdf"></i> Compartir Cotizacion (PDF)';
}

// Limpiar calculadora completa
function resetCalculator() {
    // Limpiar estado
    state.selectedBase = null;
    Object.keys(state.selectedExtras).forEach(id => { state.selectedExtras[id] = 0; });

    // Desmarcar radios
    document.querySelectorAll('input[name="base_service"]').forEach(r => r.checked = false);

    // Resetear contadores de extras
    servicesData.extras.forEach(ext => {
        const el = document.getElementById('qty-' + ext.id);
        if (el) el.textContent = '0';
    });

    // Limpiar resumen
    updateSummary();
}

// Run
document.addEventListener('DOMContentLoaded', init);

