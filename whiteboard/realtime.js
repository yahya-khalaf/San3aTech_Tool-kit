// Real-time Collaboration with PeerJS
// This handles the Instructor vs Learner roles and syncs drawing events.

const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get('room');
let isInstructor = !roomId || sessionStorage.getItem(`instructor_${roomId}`) === 'true';
let peer;
let connections = [];
let learnerLocked = false;

// UI Elements from index.html
const roleBadge = document.getElementById('role-badge');
const statusIndicator = document.getElementById('status-indicator');
const instructorControls = document.getElementById('instructor-controls');
const toggleLockBtn = document.getElementById('toggle-lock');

// Initialize Peer
function initPeer() {
    if (isInstructor) {
        if (!roomId) {
            roomId = Math.random().toString(36).substring(2, 9);
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?room=' + roomId;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }

        sessionStorage.setItem(`instructor_${roomId}`, 'true');
        peer = new Peer(roomId);
        roleBadge.textContent = 'Instructor';
        roleBadge.classList.add('bg-accent');
        instructorControls.classList.remove('hidden');

        showToast('You are the Instructor.');
    } else {
        peer = new Peer();
        roleBadge.textContent = 'Learner';
        showToast('Joining room as Learner...');
    }

    peer.on('open', (id) => {
        statusIndicator.classList.remove('offline');
        statusIndicator.classList.add('online');

        if (!isInstructor) {
            connectToInstructor();
        }
    });

    peer.on('connection', (conn) => {
        connections.push(conn);
        setupConnection(conn);
        showToast('New learner joined!');
    });

    peer.on('error', (err) => {
        console.error(err);
        showToast('Peer connection error: ' + err.type, 'danger');
    });
}

function connectToInstructor() {
    const conn = peer.connect(roomId);
    setupConnection(conn);
}

function setupConnection(conn) {
    conn.on('open', () => {
        if (!isInstructor) {
            connections.push(conn);
            showToast('Connected to Instructor!');
        } else {
            // Instructor sends current state once connection is open
            conn.send({ type: 'lock-status', locked: learnerLocked });
            const canvas = document.getElementById('whiteboard');
            conn.send({ type: 'canvas-sync', dataUrl: canvas.toDataURL() });
        }
    });

    conn.on('data', (data) => {
        handleIncomingData(data);
    });

    conn.on('close', () => {
        showToast('Connection closed');
    });
}

function handleIncomingData(data) {
    switch (data.type) {
        case 'draw-start':
            window.remoteDraw.start(data);
            break;
        case 'draw':
            window.remoteDraw.draw(data);
            break;
        case 'draw-stop':
            // No specific remote stop needed for simple pen
            break;
        case 'draw-shape':
            window.remoteDraw.shape(data);
            break;
        case 'draw-clear':
            window.remoteDraw.clear();
            break;
        case 'draw-undo':
            window.remoteDraw.undo();
            break;
        case 'lock-status':
            learnerLocked = data.locked;
            updateLockUI();
            break;
        case 'canvas-sync':
            window.remoteDraw.loadState(data.dataUrl);
            break;
    }
}

function updateLockUI() {
    if (!isInstructor) {
        const canvas = document.getElementById('whiteboard');
        if (learnerLocked) {
            canvas.style.pointerEvents = 'none';
            showToast('Instructor has locked drawing.', 'warning');
        } else {
            canvas.style.pointerEvents = 'auto';
            showToast('Drawing unlocked by Instructor.', 'success');
        }
    }
}

// Global broadcast function (called from board.js)
window.broadcastDraw = (action, data) => {
    if (!isInstructor && learnerLocked) return;

    let message = { type: '', ...data };
    if (action === 'start') message.type = 'draw-start';
    if (action === 'draw') message.type = 'draw';
    if (action === 'stop') message.type = 'draw-stop';
    if (action === 'shape') message.type = 'draw-shape';
    if (action === 'clear') message.type = 'draw-clear';
    if (action === 'undo') message.type = 'draw-undo';

    connections.forEach(conn => {
        if (conn.open) {
            conn.send(message);
        }
    });
};

// Instructor Controls
toggleLockBtn.addEventListener('click', () => {
    learnerLocked = !learnerLocked;
    const lockIcon = toggleLockBtn.querySelector('i');

    if (learnerLocked) {
        lockIcon.setAttribute('data-lucide', 'lock');
        toggleLockBtn.classList.add('active');
        showToast('Locked drawing for all learners');
    } else {
        lockIcon.setAttribute('data-lucide', 'unlock');
        toggleLockBtn.classList.remove('active');
        showToast('Unlocked drawing for all learners');
    }

    // Refresh Lucide icons for the button
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Broadcast lock status
    connections.forEach(conn => {
        if (conn.open) {
            conn.send({ type: 'lock-status', locked: learnerLocked });
        }
    });
});

// Helper for toasts
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load PeerJS library dynamically and then init
const script = document.createElement('script');
script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
script.onload = initPeer;
document.head.appendChild(script);
