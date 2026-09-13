// Register Service Worker for iPad PWA Installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

// Application State
const state = {
  pan: { x: 50, y: 50 },
  scale: 1,
  isPanning: false,
  startPan: { x: 0, y: 0 },
  cards: [],
  connections: [],
  drawing: false,
  isPenMode: false,
  activePortCardId: null,
  activeSelection: null
};

// DOM References
const docPane = document.getElementById('document-pane');
const workspacePane = document.getElementById('workspace-pane');
const workspaceSurface = document.getElementById('workspace-surface');
const cardsContainer = document.getElementById('cards-container');
const svgLayer = document.getElementById('connectors-layer');
const inkCanvas = document.getElementById('ink-layer');
const inkCtx = inkCanvas.getContext('2d');
const extractMenu = document.getElementById('extract-menu');
const btnExtract = document.getElementById('btn-extract-selection');
const btnDraw = document.getElementById('btn-draw');
const btnAccordion = document.getElementById('btn-accordion');
const foldStrip = document.getElementById('fold-1-2');
const pdfFileInput = document.getElementById('pdf-file-input');
const paneResizer = document.getElementById('pane-resizer');

// Initialize Canvas Size
function setupCanvas() {
  inkCanvas.width = 5000;
  inkCanvas.height = 5000;
  inkCtx.strokeStyle = '#38bdf8';
  inkCtx.lineWidth = 3;
  inkCtx.lineCap = 'round';
  inkCtx.lineJoin = 'round';
  updateSurfaceTransform();
}
setupCanvas();

function updateSurfaceTransform() {
  workspaceSurface.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.scale})`;
}

// Workspace Panning
workspacePane.addEventListener('pointerdown', (e) => {
  if (state.isPenMode || e.target.closest('.excerpt-card')) return;
  state.isPanning = true;
  state.startPan = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
});

window.addEventListener('pointermove', (e) => {
  if (!state.isPanning) return;
  state.pan.x = e.clientX - state.startPan.x;
  state.pan.y = e.clientY - state.startPan.y;
  updateSurfaceTransform();
});

window.addEventListener('pointerup', () => {
  state.isPanning = false;
});

// Pen / Apple Pencil Inking Support
btnDraw.addEventListener('click', () => {
  state.isPenMode = !state.isPenMode;
  btnDraw.classList.toggle('active', state.isPenMode);
  inkCanvas.classList.toggle('drawing-active', state.isPenMode);
});

let isDrawing = false;
let lastPoint = null;

inkCanvas.addEventListener('pointerdown', (e) => {
  if (!state.isPenMode) return;
  isDrawing = true;
  const rect = workspaceSurface.getBoundingClientRect();
  lastPoint = {
    x: (e.clientX - rect.left) / state.scale,
    y: (e.clientY - rect.top) / state.scale
  };
});

inkCanvas.addEventListener('pointermove', (e) => {
  if (!isDrawing || !state.isPenMode) return;
  const rect = workspaceSurface.getBoundingClientRect();
  const current = {
    x: (e.clientX - rect.left) / state.scale,
    y: (e.clientY - rect.top) / state.scale
  };

  inkCtx.beginPath();
  inkCtx.moveTo(lastPoint.x, lastPoint.y);
  inkCtx.lineTo(current.x, current.y);
  inkCtx.stroke();
  lastPoint = current;
});

window.addEventListener('pointerup', () => {
  isDrawing = false;
});

// Excerpt Selection in Document Viewport
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  if (text.length > 3 && docPane.contains(selection.anchorNode)) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const docRect = docPane.getBoundingClientRect();

    extractMenu.style.left = `${rect.left - docRect.left + rect.width / 2 - 60}px`;
    extractMenu.style.top = `${rect.top - docRect.top - 40}px`;
    extractMenu.classList.remove('hidden');

    state.activeSelection = {
      text: text,
      containerElement: selection.anchorNode.parentElement.closest('[data-source-id]') || selection.anchorNode.parentElement,
      page: selection.anchorNode.parentElement.closest('[data-page-number]')?.dataset.pageNumber || 1
    };
  } else {
    extractMenu.classList.add('hidden');
  }
});

// Create Excerpt Card on Workspace
btnExtract.addEventListener('click', () => {
  if (!state.activeSelection) return;
  const cardId = 'card_' + Date.now();
  const targetX = -state.pan.x + 100 + Math.random() * 80;
  const targetY = -state.pan.y + 100 + Math.random() * 80;

  const card = {
    id: cardId,
    text: state.activeSelection.text,
    sourceElement: state.activeSelection.containerElement,
    page: state.activeSelection.page,
    x: Math.max(20, targetX),
    y: Math.max(20, targetY)
  };

  state.cards.push(card);
  renderCard(card);
  extractMenu.classList.add('hidden');
  window.getSelection().removeAllRanges();
});

function renderCard(card) {
  const el = document.createElement('div');
  el.className = 'excerpt-card';
  el.id = card.id;
  el.style.left = `${card.x}px`;
  el.style.top = `${card.y}px`;

  el.innerHTML = `
    <div class="card-badge" title="Click to jump to document passage">PAGE ${card.page}</div>
    <div class="card-text">${card.text}</div>
    <div class="card-port" title="Drag to connect another card"></div>
  `;

  // Bidirectional Deep Linking: Jump to document source
  el.querySelector('.card-badge').addEventListener('click', (e) => {
    e.stopPropagation();
    if (card.sourceElement) {
      card.sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.sourceElement.classList.add('highlight-pulse');
      setTimeout(() => card.sourceElement.classList.remove('highlight-pulse'), 2800);
    }
  });

  // Card Dragging Logic
  el.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('card-port')) return;
    let shiftX = e.clientX - el.getBoundingClientRect().left;
    let shiftY = e.clientY - el.getBoundingClientRect().top;

    function moveAt(pageX, pageY) {
      const surfaceRect = workspaceSurface.getBoundingClientRect();
      const x = (pageX - surfaceRect.left - shiftX) / state.scale;
      const y = (pageY - surfaceRect.top - shiftY) / state.scale;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      card.x = x;
      card.y = y;
      drawConnectors();
    }

    function onPointerMove(ev) {
      moveAt(ev.clientX, ev.clientY);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', function upHandler() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', upHandler);
    });
  });

  // Dynamic Bezier Thread Port Connection
  const port = el.querySelector('.card-port');
  port.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    state.activePortCardId = card.id;

    function endConnection(ev) {
      const destCardEl = ev.target.closest('.excerpt-card');
      if (destCardEl && destCardEl.id !== state.activePortCardId) {
        state.connections.push({ from: state.activePortCardId, to: destCardEl.id });
        drawConnectors();
      }
      state.activePortCardId = null;
      window.removeEventListener('pointerup', endConnection);
    }

    window.addEventListener('pointerup', endConnection);
  });

  cardsContainer.appendChild(el);
}

// Render Curved Bezier Connector Lines
function drawConnectors() {
  svgLayer.innerHTML = '';
  state.connections.forEach(conn => {
    const fromCard = state.cards.find(c => c.id === conn.from);
    const toCard = state.cards.find(c => c.id === conn.to);
    if (!fromCard || !toCard) return;

    const x1 = fromCard.x + 250;
    const y1 = fromCard.y + 40;
    const x2 = toCard.x;
    const y2 = toCard.y + 40;

    const dx = Math.abs(x2 - x1) * 0.5;
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#3b82f6');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('fill', 'none');
    svgLayer.appendChild(path);
  });
}

// Accordion Fold Mechanism
btnAccordion.addEventListener('click', () => {
  foldStrip.classList.toggle('hidden');
});

// PDF Rendering Integration via PDF.js
pdfFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.onload = async function() {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;
    const renderTarget = document.getElementById('pdf-render-container');
    renderTarget.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.3 });

      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'doc-page';
      pageWrapper.dataset.pageNumber = pageNum;
      pageWrapper.style.padding = '10px';

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = '100%';

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      pageWrapper.appendChild(canvas);
      renderTarget.appendChild(pageWrapper);
    }
  };
  fileReader.readAsArrayBuffer(file);
});

// Split Viewport Resizer
let isResizing = false;
paneResizer.addEventListener('pointerdown', () => {
  isResizing = true;
});

window.addEventListener('pointermove', (e) => {
  if (!isResizing) return;
  const percentage = (e.clientX / window.innerWidth) * 100;
  if (percentage > 20 && percentage < 80) {
    docPane.style.width = `${percentage}%`;
  }
});

window.addEventListener('pointerup', () => {
  isResizing = false;
});