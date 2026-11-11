// Session layer: creates/joins boards, keeps a WebSocket to the board's
// Durable Object (/api/whiteboard/<room>/ws), and drives roles, the
// "students can draw" toggle, undo/redo, clear, sharing and presence.
(() => {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const ROOM_RE = /^[a-z0-9]{6,32}$/;
    const store = {
        get(k) { try { return localStorage.getItem(k); } catch { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
    };

    function randomId(n) {
        const bytes = crypto.getRandomValues(new Uint8Array(n));
        return Array.from(bytes, (b) => (b % 36).toString(36)).join('');
    }

    function toast(message, type = 'info') {
        const container = $('toast-container');
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        }, 3200);
    }

    function setIcon(btn, name) {
        const old = btn.querySelector('svg, i');
        const i = document.createElement('i');
        i.setAttribute('data-lucide', name);
        if (old) old.replaceWith(i); else btn.prepend(i);
        window.lucide && window.lucide.createIcons();
    }

    // ---------- Room + identity ----------

    const params = new URLSearchParams(location.search);
    let room = (params.get('room') || '').trim().toLowerCase();
    if (room && !ROOM_RE.test(room)) room = '';

    let instructorKey = null;
    if (room) {
        const hashKey = new URLSearchParams(location.hash.slice(1)).get('key');
        if (hashKey) {
            store.set(`wb_key_${room}`, hashKey);
            history.replaceState(null, '', location.pathname + location.search);
        }
        instructorKey = hashKey || store.get(`wb_key_${room}`);
    }

    let clientId = store.get('wb_client_id');
    if (!clientId || !/^[A-Za-z0-9_-]{8,40}$/.test(clientId)) {
        clientId = randomId(20);
        store.set('wb_client_id', clientId);
    }

    // ---------- Landing ----------

    function showLanding(error) {
        $('app').classList.add('hidden');
        $('landing').classList.remove('hidden');
        const err = $('landing-error');
        err.textContent = error || '';
        err.classList.toggle('hidden', !error);
    }

    $('create-board').addEventListener('click', async () => {
        const btn = $('create-board');
        btn.disabled = true;
        try {
            const res = await fetch('/api/whiteboard', { method: 'POST' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            store.set(`wb_key_${data.room}`, data.key);
            location.href = `${location.pathname}?room=${data.room}#key=${data.key}`;
        } catch (e) {
            console.error(e);
            showLanding('Could not create a board. Check your connection and try again.');
            btn.disabled = false;
        }
    });

    $('join-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = $('join-input').value.trim();
        let code = raw.toLowerCase();
        try {
            const fromUrl = new URL(raw).searchParams.get('room');
            if (fromUrl) code = fromUrl.toLowerCase();
        } catch { /* not a URL, treat as a code */ }
        if (!ROOM_RE.test(code)) {
            showLanding('That doesn’t look like a valid board link or code.');
            return;
        }
        location.href = `${location.pathname}?room=${code}`;
    });

    if (!room) {
        showLanding();
        return;
    }
    $('app').classList.remove('hidden');

    // ---------- Connection ----------

    let ws = null;
    let ready = false;
    let buffer = null;
    let retry = 0;
    let pingTimer = 0;
    let notFound = false;
    let firstReady = true;
    let role = 'student';
    let studentsCanEdit = false;
    const outbox = []; // undo/redo issued while offline

    function setStatus(state) {
        const el = $('status-indicator');
        el.className = `indicator ${state}`;
        el.title = { online: 'Connected', connecting: 'Connecting…', offline: 'Offline, reconnecting…' }[state];
    }

    function rawSend(msg) {
        ws.send(JSON.stringify(msg));
    }

    window.Sync = {
        send(msg) {
            if (ready && ws && ws.readyState === WebSocket.OPEN) {
                rawSend(msg);
            } else if (msg.type === 'undo' || msg.type === 'redo') {
                outbox.push(msg);
            }
            // Finished strokes are re-sent from Board's pending list on reconnect;
            // live previews are simply dropped while offline.
        },
    };

    function connect() {
        setStatus('connecting');
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const q = new URLSearchParams({ client: clientId });
        if (instructorKey) q.set('key', instructorKey);
        ws = new WebSocket(`${proto}//${location.host}/api/whiteboard/${room}/ws?${q}`);

        ws.onopen = () => {
            retry = 0;
            clearInterval(pingTimer);
            pingTimer = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send('ping'), 25000);
        };
        ws.onmessage = (e) => {
            if (e.data === 'pong') return;
            let msg;
            try { msg = JSON.parse(e.data); } catch { return; }
            handle(msg);
        };
        ws.onclose = () => {
            ready = false;
            clearInterval(pingTimer);
            window.Board.clearRemoteLive();
            if (notFound) return;
            setStatus('offline');
            const delay = Math.min(10000, 500 * 2 ** retry++);
            setTimeout(connect, delay);
        };
    }

    function handle(msg) {
        switch (msg.type) {
            case 'init':
                role = msg.role;
                studentsCanEdit = !!msg.studentsCanEdit;
                buffer = [];
                applyRole();
                break;
            case 'ops':
                if (buffer) for (const op of msg.ops) buffer.push(op);
                break;
            case 'ready': {
                const pending = window.Board.load(buffer || []);
                buffer = null;
                ready = true;
                setStatus('online');
                for (const op of pending) rawSend({ type: 'commit', op });
                outbox.splice(0).forEach(rawSend);
                applyPermission(false);
                if (firstReady) {
                    firstReady = false;
                    toast(role === 'instructor'
                        ? 'You are the instructor. Use Share to invite students.'
                        : 'Joined the board.');
                }
                break;
            }
            case 'op': window.Board.commit(msg.op); break;
            case 'live': window.Board.remoteLive(msg); break;
            case 'live-end': window.Board.remoteLiveEnd(msg.id); break;
            case 'remove': window.Board.remove(msg.id); break;
            case 'restore': window.Board.restore(msg.op); break;
            case 'reject':
                window.Board.remove(msg.id);
                toast({
                    locked: 'Drawing is turned off by the instructor.',
                    full: 'This board is full. Ask the instructor to clear it.',
                }[msg.reason] || 'That change could not be saved.', 'warning');
                break;
            case 'permission':
                studentsCanEdit = !!msg.studentsCanEdit;
                if (!studentsCanEdit && role !== 'instructor') window.Board.clearRemoteLive();
                applyPermission(true);
                break;
            case 'presence':
                $('presence-count').textContent = String(msg.students + msg.instructors);
                $('presence').title = `${msg.instructors ? 'Instructor' : 'No instructor'} + ${msg.students} student${msg.students === 1 ? '' : 's'}`;
                break;
            case 'history':
                $('undo-btn').disabled = !msg.undo;
                $('redo-btn').disabled = !msg.redo;
                break;
            case 'error':
                if (msg.code === 'not_found') {
                    notFound = true;
                    showLanding('This board doesn’t exist or has expired. Create a new one or check the link.');
                }
                break;
        }
    }

    // ---------- Roles & permissions ----------

    function applyRole() {
        const isInstructor = role === 'instructor';
        document.body.classList.toggle('role-instructor', isInstructor);
        document.body.classList.toggle('role-student', !isInstructor);
        $('role-badge').textContent = isInstructor ? 'Instructor' : 'Student';
        $('role-badge').classList.toggle('bg-accent', isInstructor);
    }

    function applyPermission(announce) {
        const isInstructor = role === 'instructor';
        const can = isInstructor || studentsCanEdit;
        window.Board.setCanDraw(can);
        document.body.classList.toggle('view-only', !can);

        const btn = $('toggle-students');
        btn.classList.toggle('active', studentsCanEdit);
        btn.querySelector('span').textContent = studentsCanEdit ? 'Students: can draw' : 'Students: view only';
        setIcon(btn, studentsCanEdit ? 'pencil' : 'eye');

        if (!announce) return;
        if (isInstructor) {
            toast(studentsCanEdit ? 'Students can now draw on the board.' : 'Students are now view only.');
        } else {
            toast(can ? 'The instructor turned on drawing. You can draw now.' : 'The instructor switched the board to view only.',
                can ? 'success' : 'warning');
        }
    }

    $('toggle-students').addEventListener('click', () => {
        window.Sync.send({ type: 'set-permission', studentsCanEdit: !studentsCanEdit });
    });

    // ---------- Undo / redo / clear ----------

    const canEdit = () => role === 'instructor' || studentsCanEdit;
    const undo = () => canEdit() && window.Sync.send({ type: 'undo' });
    const redo = () => canEdit() && window.Sync.send({ type: 'redo' });

    $('undo-btn').addEventListener('click', undo);
    $('redo-btn').addEventListener('click', redo);

    document.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (!(e.ctrlKey || e.metaKey)) return;
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    });

    $('clear-board').addEventListener('click', () => {
        if (role !== 'instructor') return;
        if (!confirm('Clear the board for everyone? You can undo this with Ctrl+Z.')) return;
        const op = { id: randomId(12), t: 'clear' };
        window.Board.commit({ ...op, q: Infinity });
        window.Sync.send({ type: 'commit', op });
    });

    // ---------- Share / download ----------

    const studentLink = `${location.origin}${location.pathname}?room=${room}`;
    $('share-btn').addEventListener('click', () => {
        $('student-link').value = studentLink;
        $('instructor-link').value = instructorKey ? `${studentLink}#key=${instructorKey}` : '';
        $('share-dialog').showModal();
    });

    document.querySelectorAll('[data-copy]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const input = $(btn.dataset.copy);
            try {
                await navigator.clipboard.writeText(input.value);
            } catch {
                input.select();
                document.execCommand('copy');
            }
            const label = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(() => { btn.textContent = label; }, 1500);
        });
    });

    $('download-btn').addEventListener('click', () => {
        const a = document.createElement('a');
        a.download = `whiteboard-${room}-${Date.now()}.png`;
        a.href = window.Board.exportImage();
        a.click();
    });

    connect();
})();
