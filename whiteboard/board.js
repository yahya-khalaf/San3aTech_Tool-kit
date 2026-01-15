const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const toolbar = document.getElementById('toolbar');
const colorPicker = document.getElementById('color-picker');
const sizeSlider = document.getElementById('size-slider');
const sizePreview = document.getElementById('size-preview');

// State
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#3b82f6';
let currentSize = 5;
let startX, startY;
let snapshot;
let undoStack = [];
const MAX_UNDO = 20;

// Initialize
function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    saveState(); // Save initial empty state
}

window.addEventListener('resize', () => {
    // Save current content before resize
    const tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.putImageData(tempImage, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
});

// Event Listeners for Tools
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id.startsWith('tool-')) {
            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.id.replace('tool-', '');
        }
    });
});

colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

sizeSlider.addEventListener('input', (e) => {
    currentSize = e.target.value;
    sizePreview.textContent = `${currentSize}px`;
});

// Drawing Logic
const startDraw = (e) => {
    isDrawing = true;
    startX = e.offsetX || e.touches[0].clientX;
    startY = e.offsetY || e.touches[0].clientY;

    ctx.beginPath();
    ctx.lineWidth = currentSize;
    ctx.strokeStyle = currentTool === 'eraser' ? '#1e293b' : currentColor;
    ctx.fillStyle = currentColor;

    // For shapes, we need a snapshot of the canvas to "preview" them
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (currentTool === 'pen' || currentTool === 'eraser') {
        ctx.moveTo(startX, startY);
    }

    // Emit start event for real-time (implemented in realtime.js)
    if (window.broadcastDraw) {
        window.broadcastDraw('start', { x: startX, y: startY, tool: currentTool, color: currentColor, size: currentSize });
    }
};

const draw = (e) => {
    if (!isDrawing) return;

    const x = e.offsetX || e.touches[0].clientX;
    const y = e.offsetY || e.touches[0].clientY;

    if (currentTool === 'pen' || currentTool === 'eraser') {
        ctx.lineTo(x, y);
        ctx.stroke();

        if (window.broadcastDraw) {
            window.broadcastDraw('draw', { x, y });
        }
    } else {
        // Shapes: restore snapshot and redraw the shape
        ctx.putImageData(snapshot, 0, 0);
        drawShape(currentTool, startX, startY, x, y);
    }
};

const stopDraw = (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    const x = e.offsetX || (e.changedTouches ? e.changedTouches[0].clientX : startX);
    const y = e.offsetY || (e.changedTouches ? e.changedTouches[0].clientY : startY);

    if (currentTool !== 'pen' && currentTool !== 'eraser') {
        drawShape(currentTool, startX, startY, x, y);
        if (window.broadcastDraw) {
            window.broadcastDraw('shape', { tool: currentTool, x1: startX, y1: startY, x2: x, y2: y });
        }
    } else {
        if (window.broadcastDraw) {
            window.broadcastDraw('stop', {});
        }
    }

    saveState();
};

function drawShape(tool, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.lineWidth = currentSize;
    ctx.strokeStyle = currentColor;

    if (tool === 'rect') {
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (tool === 'circle') {
        let radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        ctx.stroke();
    } else if (tool === 'line') {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

// State Management
function saveState() {
    if (undoStack.length >= MAX_UNDO) undoStack.shift();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function undo() {
    if (undoStack.length > 1) {
        undoStack.pop(); // Remove current state
        const prevState = undoStack[undoStack.length - 1];
        ctx.putImageData(prevState, 0, 0);

        if (window.broadcastDraw) {
            window.broadcastDraw('undo', {});
        }
    }
}

function clearBoard(remote = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();

    if (!remote && window.broadcastDraw) {
        window.broadcastDraw('clear', {});
    }
}

// UI Buttons
document.getElementById('clear-board').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire board?')) {
        clearBoard();
    }
});

document.getElementById('undo-btn').addEventListener('click', undo);

document.getElementById('download-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.jpg`;

    // Draw background before saving
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = '#1e293b';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
    link.click();
});

// Event Listeners
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', stopDraw);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
window.addEventListener('touchend', stopDraw);

initCanvas();

// Global methods for realtime side
window.remoteDraw = {
    start: (data) => {
        ctx.beginPath();
        ctx.lineWidth = data.size;
        ctx.strokeStyle = data.tool === 'eraser' ? '#1e293b' : data.color;
        ctx.moveTo(data.x, data.y);
    },
    draw: (data) => {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
    },
    shape: (data) => {
        ctx.strokeStyle = data.color || currentColor;
        ctx.lineWidth = data.size || currentSize;
        drawShape(data.tool, data.x1, data.y1, data.x2, data.y2);
    },
    clear: () => clearBoard(true),
    undo: () => {
        if (undoStack.length > 1) {
            undoStack.pop();
            ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);
        }
    }
};
