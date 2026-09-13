/**
 * LiquidText Core Architecture Engine
 * Pure client-side implementation: TextLayer mapping, multi-touch pinch folding,
 * spatial canvas pan/zoom, card clustering, bidirectional deep-linking, and Apple Pencil ink.
 */

// Global Application State
const state = {
  pan: { x: 80, y: 80 },
  scale: 1,
  isPanning: false,
  startPan: { x: 0, y: 0 },
  mode: 'highlight', // 'highlight' | 'pen'
  cards: [],
  connections: [],
  activeSelection: null,
  activePortFrom: null,
  isAccordionCollapsed: false,
  pdfDocument: null
};

// DOM Handles
const docScroll = document.getElementById('document-scroll-container');
const viewport = document.getElementById('workspace-viewport');
const surface = document.getElementById('infinite-surface');
const cardsLayer = document.getElementById('cards-layer');
const svgLayer = document.getElementById('svg-connectors');
const inkCanvas = document.getElementById('ink-canvas');
const inkCtx = inkCanvas.getContext('2d');
const extractBubble = document.getElementById('extract-bubble');
const btnExtract = document.getElementById('btn-extract-to-board');
const btnAccordion = document.getElementById('btn-accordion-toggle');
const btnHighlight = document.getElementById('btn-highlight-mode');
const btnPen = document.getElementById('btn-pen-mode');
const btnReset = document.getElementById('btn-reset-canvas');
const btnClear = document.getElementById('btn-clear-canvas');
const pdfInput = document.getElementById('pdf-input');
const resizer = document.getElementById('pane-resizer');
const docColumn = document.getElementById('document-column');

// 1. Initialize Surface & Ink Layer
function initWorkspace() {
  inkCanvas.width = 10000;
  inkCanvas.height = 10000;
  inkCtx.strokeStyle = '#38bdf8';
  inkCtx.lineWidth = 3;
  inkCtx.lineCap = 'round';
  inkCtx.lineJoin = 'round';
  updateTransform();
}
initWorkspace();

function updateTransform() {
  surface.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.scale})`;
}

// 2. Infinite Pan & Zoom Navigation on Canvas
viewport.addEventListener('pointerdown', (e) => {
  if (state.mode === 'pen' || e.target.closest('.excerpt-card')) return;
  state.isPanning = true;
  state.startPan = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
});

window.addEventListener('pointermove', (e) => {
  if (!state.isPanning) return;
  state.pan.x = e.clientX - state.startPan.x;
  state.pan.y = e.clientY - state.startPan.y;
  updateTransform();
});

window.addEventListener('pointerup', () => {
  state.isPanning = false;
});

// Canvas Zoom via Wheel / Pinch
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
  const newScale = Math.min(Math.max(0.3, state.scale * zoomFactor), 3.0);
  
  const rect = viewport.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  state.pan.x = mouseX - (mouseX - state.pan.x) * (newScale / state.scale);
  state.pan.y = mouseY - (mouseY - state.pan.y) * (newScale / state.scale);
  state.scale = newScale;
  updateTransform();
}, { passive: false });

// 3. Apple Pencil & Freehand Ink Drawing
let isDrawing = false;
let lastPenPoint = null;

btnPen.addEventListener('click', () => {
  state.mode = 'pen';
  btnPen.classList.add('active');
  btnHighlight.classList.remove('active');
  inkCanvas.classList.add('pen-active');
});

btnHighlight.addEventListener('click', () => {
  state.mode = 'highlight';
  btnHighlight.classList.add('active');
  btnPen.classList.remove('active');
  inkCanvas.classList.remove('pen-active');
});

inkCanvas.addEventListener('pointerdown', (e) => {
  if (state.mode !== 'pen') return;
  isDrawing = true;
  const rect = surface.getBoundingClientRect();
  lastPenPoint = {
    x: (e.clientX - rect.left) / state.scale,
    y: (e.clientY - rect.top) / state.scale
  };
});

inkCanvas.addEventListener('pointermove', (e) => {
  if (!isDrawing || state.mode !== 'pen') return;
  const rect = surface.getBoundingClientRect();
  const cur = {
    x: (e.clientX - rect.left) / state.scale,
    y: (e.clientY - rect.top) / state.scale
  };

  inkCtx.beginPath();
  inkCtx.moveTo(lastPenPoint.x, lastPenPoint.y);
  inkCtx.lineTo(cur.x, cur.y);
  inkCtx.stroke();
  lastPenPoint = cur;
});

window.addEventListener('pointerup', () => { isDrawing = false; });

// 4. Text Selection & Excerpt Extraction
document.addEventListener('selectionchange', () => {
  if (state.mode !== 'highlight') return;
  const sel = window.getSelection();
  const text = sel.toString().trim();

  if (text.length > 2 && docColumn.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const docRect = docColumn.getBoundingClientRect();

    extractBubble.style.left = `${rect.left - docRect.left + rect.width / 2}px`;
    extractBubble.style.top = `${rect.top - docRect.top}px`;
    extractBubble.classList.remove('hidden');

    const sourcePage = sel.anchorNode.parentElement.closest('[data-page]')?.dataset.page || '1';
    state.activeSelection = {
      text,
      page: sourcePage,
      anchorNode: sel.anchorNode.parentElement
    };
  } else {
    extractBubble.classList.add('hidden');
  }
});

btnExtract.addEventListener('click', () => {
  if (!state.activeSelection) return;

  // Compute position on infinite canvas centered in current viewport
  const viewRect = viewport.getBoundingClientRect();
  const centerX = (viewRect.width / 2 - state.pan.x) / state.scale;
  const centerY = (viewRect.height / 2 - state.pan.y) / state.scale;

  const newCard = {
    id: 'card_' + Date.now(),
    text: state.activeSelection.text,
    page: state.activeSelection.page,
    sourceElement: state.activeSelection.anchorNode,
    x: centerX + (Math.random() * 40 - 20),
    y: centerY + (Math.random() * 40 - 20)
  };

  state.cards.push(newCard);
  createCardDOM(newCard);
  extractBubble.classList.add('hidden');
  window.getSelection().removeAllRanges();
});

// 5. Excerpt Card DOM, Snapping & Bidirectional Linking
function createCardDOM(card) {
  const el = document.createElement('div');
  el.className = 'excerpt-card';
  el.id = card.id;
  el.style.left = `${card.x}px`;
  el.style.top = `${card.y}px`;

  el.innerHTML = `
    <div class="card-header">
      <span class="backlink-badge" title="Jump to original passage">
        ⮐ Page ${card.page}
      </span>
    </div>
    <div class="card-body">${card.text}</div>
    <div class="connector-port" title="Drag to connect another note"></div>
  `;

  // Bidirectional Deep-Linking to original document passage
  el.querySelector('.backlink-badge').addEventListener('click', (e) => {
    e.stopPropagation();
    if (card.sourceElement) {
      card.sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.sourceElement.classList.add('source-highlight-pulse');
      setTimeout(() => card.sourceElement.classList.remove('source-highlight-pulse'), 2500);
    }
  });

  // Dragging & Clustered Snapping Logic
  el.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('connector-port')) return;
    let startX = e.clientX;
    let startY = e.clientY;
    let initialLeft = card.x;
    let initialTop = card.y;

    function onMove(ev) {
      const dx = (ev.clientX - startX) / state.scale;
      const dy = (ev.clientY - startY) / state.scale;
      let targetX = initialLeft + dx;
      let targetY = initialTop + dy;

      // Card Snapping: Detect nearby cards to cluster like LiquidText outlines
      el.classList.remove('snapped');
      for (let other of state.cards) {
        if (other.id === card.id) continue;
        const snapThreshold = 30;
        // Snap directly beneath an existing card
        if (Math.abs(targetX - other.x) < snapThreshold && Math.abs(targetY - (other.y + 110)) < snapThreshold) {
          targetX = other.x;
          targetY = other.y + 90;
          el.classList.add('snapped');
          break;
        }
      }

      card.x = targetX;
      card.y = targetY;
      el.style.left = `${targetX}px`;
      el.style.top = `${targetY}px`;
      renderConnectors();
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Connector Port Threading
  const port = el.querySelector('.connector-port');
  port.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    state.activePortFrom = card.id;

    function handlePortUp(ev) {
      const targetCardEl = ev.target.closest('.excerpt-card');
      if (targetCardEl && targetCardEl.id !== state.activePortFrom) {
        state.connections.push({ from: state.activePortFrom, to: targetCardEl.id });
        renderConnectors();
      }
      state.activePortFrom = null;
      window.removeEventListener('pointerup', handlePortUp);
    }

    window.addEventListener('pointerup', handlePortUp);
  });

  cardsLayer.appendChild(el);
}

// 6. SVG Cubic Bezier Connector Engine
function renderConnectors() {
  svgLayer.innerHTML = '';
  state.connections.forEach(conn => {
    const from = state.cards.find(c => c.id === conn.from);
    const to = state.cards.find(c => c.id === conn.to);
    if (!from || !to) return;

    const x1 = from.x + 270;
    const y1 = from.y + 45;
    const x2 = to.x;
    const y2 = to.y + 45;

    const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#38bdf8');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-dasharray', '6 3');
    svgLayer.appendChild(path);
  });
}

// 7. True LiquidText Accordion Pinch-to-Contract Mechanic
btnAccordion.addEventListener('click', toggleAccordion);

function toggleAccordion() {
  state.isAccordionCollapsed = !state.isAccordionCollapsed;
  const creases = document.querySelectorAll('.accordion-crease-container');
  creases.forEach(c => c.classList.toggle('hidden', !state.isAccordionCollapsed));
  btnAccordion.classList.toggle('active', state.isAccordionCollapsed);
}

// Multi-Touch Pinch Tracking for iPad
let touchDistanceInitial = 0;
docScroll.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    touchDistanceInitial = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY
    );
  }
});

docScroll.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY
    );
    // When 2 fingers pinch inward by more than 60px: Trigger accordion collapse
    if (touchDistanceInitial - currentDistance > 60 && !state.isAccordionCollapsed) {
      toggleAccordion();
      touchDistanceInitial = currentDistance;
    }
  }
});

// 8. Mozilla PDF.js Synchronized Text-Layer Engine
pdfInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.onload = async function() {
    const typedarray = new Uint8Array(this.result);
    state.pdfDocument = await pdfjsLib.getDocument(typedarray).promise;

    document.getElementById('demo-pages').classList.add('hidden');
    const dynamicContainer = document.getElementById('pdf-dynamic-pages');
    dynamicContainer.innerHTML = '';
    dynamicContainer.classList.remove('hidden');

    for (let pageNum = 1; pageNum <= state.pdfDocument.numPages; pageNum++) {
      const page = await state.pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.4 });

      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'pdf-page-wrapper';
      pageWrapper.dataset.page = pageNum;
      pageWrapper.style.width = `${viewport.width}px`;
      pageWrapper.style.height = `${viewport.height}px`;

      // 1. Canvas raster layer
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      pageWrapper.appendChild(canvas);

      // 2. Transparent Synchronized TextLayer for True Selection & Highlighting
      const textContent = await page.getTextContent();
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;

      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
      });

      pageWrapper.appendChild(textLayerDiv);
      dynamicContainer.appendChild(pageWrapper);

      // Add accordion crease between every 3 pages
      if (pageNum < state.pdfDocument.numPages && pageNum % 3 === 0) {
        const crease = document.createElement('div');
        crease.className = 'accordion-crease-container hidden';
        crease.innerHTML = `<div class="accordion-badge">Pages ${pageNum + 1}–${Math.min(pageNum + 2, state.pdfDocument.numPages)} Folded</div>`;
        crease.addEventListener('click', () => crease.classList.add('hidden'));
        dynamicContainer.appendChild(crease);
      }
    }
  };
  fileReader.readAsArrayBuffer(file);
});

// 9. Split Pane Resizer
let isResizing = false;
resizer.addEventListener('pointerdown', () => { isResizing = true; });

window.addEventListener('pointermove', (e) => {
  if (!isResizing) return;
  const pct = (e.clientX / window.innerWidth) * 100;
  if (pct > 20 && pct < 80) {
    docColumn.style.width = `${pct}%`;
  }
});

window.addEventListener('pointerup', () => { isResizing = false; });

// 10. Toolbar Utility Actions
btnReset.addEventListener('click', () => {
  state.pan = { x: 80, y: 80 };
  state.scale = 1;
  updateTransform();
});

btnClear.addEventListener('click', () => {
  state.cards = [];
  state.connections = [];
  cardsLayer.innerHTML = '';
  svgLayer.innerHTML = '';
  inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
});
