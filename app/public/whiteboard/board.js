// Canvas engine: renders the board from a list of operations and turns
// pointer input into new operations. Networking lives in realtime.js, which
// talks to this file through window.Board and provides window.Sync.
//
// Operation format (shared with the server):
//   { id, t: 'pen'|'eraser', c: '#rrggbb', s: size, p: [x,y, x,y, ...] }
//   { id, t: 'rect'|'circle'|'line'|'arrow', c, s, p: [x1,y1,x2,y2] }
//   { id, t: 'clear' }
// plus q = server sequence number (Infinity while not yet confirmed).
(() => {
    'use strict';

    const W = 1920;
    const H = 1080;
    const FREEHAND = new Set(['pen', 'eraser']);
    const LIVE_SEND_MS = 33;

    const stage = document.getElementById('board-stage');
    const baseCanvas = document.getElementById('board-base');
    const liveCanvas = document.getElementById('board-live');
    const base = baseCanvas.getContext('2d');
    const live = liveCanvas.getContext('2d');
    for (const c of [baseCanvas, liveCanvas]) {
        c.width = W;
        c.height = H;
    }

    const BG = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#240D18';

    let ops = [];                  // committed (q = seq) followed by pending (q = Infinity)
    const remoteLive = new Map();  // other people's in-progress strokes, by id
    let mine = null;               // my in-progress stroke
    let activePointer = null;
    let unsentPoints = [];
    let liveTimer = 0;
    let canDraw = false;

    let tool = 'pen';
    let color = '#ffffff';
    let size = 5;

    const send = (msg) => window.Sync && window.Sync.send(msg);
    const byQ = (a, b) => (a.q === b.q ? 0 : a.q < b.q ? -1 : 1);

    function uid() {
        const bytes = crypto.getRandomValues(new Uint8Array(12));
        return Array.from(bytes, (b) => (b % 36).toString(36)).join('');
    }

    function strip(op) {
        const { q, ...rest } = op;
        return rest;
    }

    // ---------- Rendering ----------

    function drawFreehand(ctx, p, s) {
        if (p.length < 2) return;
        if (p.length <= 4) {
            ctx.beginPath();
            ctx.arc(p[0], p[1], s / 2, 0, Math.PI * 2);
            ctx.fill();
            if (p.length === 2) return;
        }
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        for (let i = 2; i < p.length - 2; i += 2) {
            const mx = (p[i] + p[i + 2]) / 2;
            const my = (p[i + 1] + p[i + 3]) / 2;
            ctx.quadraticCurveTo(p[i], p[i + 1], mx, my);
        }
        ctx.lineTo(p[p.length - 2], p[p.length - 1]);
        ctx.stroke();
    }

    function drawShape(ctx, t, p, s) {
        const [x1, y1, x2, y2] = p;
        ctx.beginPath();
        if (t === 'rect') {
            ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        } else if (t === 'circle') {
            ctx.arc(x1, y1, Math.hypot(x2 - x1, y2 - y1), 0, Math.PI * 2);
        } else {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            if (t === 'arrow' && (x1 !== x2 || y1 !== y2)) {
                const a = Math.atan2(y2 - y1, x2 - x1);
                const h = Math.max(14, s * 3);
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - h * Math.cos(a - Math.PI / 7), y2 - h * Math.sin(a - Math.PI / 7));
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - h * Math.cos(a + Math.PI / 7), y2 - h * Math.sin(a + Math.PI / 7));
            }
        }
        ctx.stroke();
    }

    function drawOp(ctx, op, preview) {
        if (op.t === 'clear') {
            ctx.clearRect(0, 0, W, H);
            return;
        }
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = op.s;
        if (op.t === 'eraser') {
            if (preview) {
                // The live layer can't cut holes in the base layer; paint background instead.
                ctx.strokeStyle = ctx.fillStyle = BG;
            } else {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = ctx.fillStyle = '#000';
            }
        } else {
            ctx.strokeStyle = ctx.fillStyle = op.c;
        }
        if (FREEHAND.has(op.t)) drawFreehand(ctx, op.p, op.s);
        else drawShape(ctx, op.t, op.p, op.s);
        ctx.restore();
    }

    function redraw() {
        // Anything before the latest confirmed clear is invisible; drop it.
        for (let i = ops.length - 1; i > 0; i--) {
            if (ops[i].t === 'clear' && ops[i].q !== Infinity) {
                ops = ops.slice(i);
                break;
            }
        }
        base.clearRect(0, 0, W, H);
        for (const op of ops) drawOp(base, op, false);
    }

    let liveFrame = 0;
    function scheduleLive() {
        if (liveFrame) return;
        liveFrame = requestAnimationFrame(() => {
            liveFrame = 0;
            live.clearRect(0, 0, W, H);
            for (const op of remoteLive.values()) drawOp(live, op, true);
            if (mine) drawOp(live, mine, true);
        });
    }

    function isSortedAt(i) {
        const q = ops[i].q;
        return (i === 0 || ops[i - 1].q <= q) && (i === ops.length - 1 || ops[i + 1].q >= q);
    }

    // ---------- Local input ----------

    function toBoard(e) {
        const r = liveCanvas.getBoundingClientRect();
        return [
            Math.round(((e.clientX - r.left) * W) / r.width * 10) / 10,
            Math.round(((e.clientY - r.top) * H) / r.height * 10) / 10,
        ];
    }

    function flushLive() {
        liveTimer = 0;
        if (!mine) return;
        const { id, t, c, s } = mine;
        if (FREEHAND.has(t)) {
            if (!unsentPoints.length) return;
            send({ type: 'live', id, t, c, s, a: unsentPoints });
            unsentPoints = [];
        } else {
            send({ type: 'live', id, t, c, s, p: mine.p });
        }
    }

    function queueLive() {
        if (!liveTimer) liveTimer = setTimeout(flushLive, LIVE_SEND_MS);
    }

    function cancelStroke() {
        if (!mine) return;
        send({ type: 'live-end', id: mine.id });
        mine = null;
        activePointer = null;
        unsentPoints = [];
        scheduleLive();
    }

    liveCanvas.addEventListener('pointerdown', (e) => {
        if (!canDraw || e.button !== 0 || mine) return;
        e.preventDefault();
        liveCanvas.setPointerCapture(e.pointerId);
        activePointer = e.pointerId;
        const [x, y] = toBoard(e);
        mine = { id: uid(), t: tool, c: color, s: size, p: FREEHAND.has(tool) ? [x, y] : [x, y, x, y] };
        unsentPoints = FREEHAND.has(tool) ? [x, y] : [];
        flushLive();
        scheduleLive();
    });

    liveCanvas.addEventListener('pointermove', (e) => {
        if (!mine || e.pointerId !== activePointer) return;
        const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        if (FREEHAND.has(mine.t)) {
            const p = mine.p;
            for (const ev of events.length ? events : [e]) {
                const [x, y] = toBoard(ev);
                if (Math.hypot(x - p[p.length - 2], y - p[p.length - 1]) < 1.5) continue;
                p.push(x, y);
                unsentPoints.push(x, y);
            }
        } else {
            const [x, y] = toBoard(e);
            mine.p[2] = x;
            mine.p[3] = y;
        }
        scheduleLive();
        queueLive();
    });

    function finishStroke(e) {
        if (!mine || e.pointerId !== activePointer) return;
        clearTimeout(liveTimer);
        liveTimer = 0;
        const op = mine;
        mine = null;
        activePointer = null;
        unsentPoints = [];

        if (!FREEHAND.has(op.t) && op.p[0] === op.p[2] && op.p[1] === op.p[3]) {
            send({ type: 'live-end', id: op.id }); // zero-size shape: discard
            scheduleLive();
            return;
        }
        op.q = Infinity;
        ops.push(op);
        drawOp(base, op, false);
        scheduleLive();
        send({ type: 'commit', op: strip(op) });
    }

    liveCanvas.addEventListener('pointerup', finishStroke);
    liveCanvas.addEventListener('pointercancel', finishStroke);

    // ---------- Toolbar ----------

    document.querySelectorAll('[data-tool]').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelector('[data-tool].active')?.classList.remove('active');
            btn.classList.add('active');
            tool = btn.dataset.tool;
        });
    });

    const colorPicker = document.getElementById('color-picker');
    function selectColor(value, fromSwatch) {
        color = value.toLowerCase();
        document.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('active', s === fromSwatch));
        colorPicker.classList.toggle('active', !fromSwatch);
        if (fromSwatch) colorPicker.value = color;
        if (tool === 'eraser') document.querySelector('[data-tool="pen"]').click();
    }
    document.querySelectorAll('.swatch').forEach((sw) => sw.addEventListener('click', () => selectColor(sw.dataset.color, sw)));
    colorPicker.addEventListener('input', () => selectColor(colorPicker.value, null));

    const sizeSlider = document.getElementById('size-slider');
    const sizePreview = document.getElementById('size-preview');
    sizeSlider.addEventListener('input', () => {
        size = Number(sizeSlider.value);
        sizePreview.textContent = `${size}px`;
    });

    // ---------- API used by realtime.js ----------

    window.Board = {
        /** Replace the board with the server's state; keeps my unconfirmed ops and returns them. */
        load(serverOps) {
            const known = new Set(serverOps.map((o) => o.id));
            const pending = ops.filter((o) => o.q === Infinity && !known.has(o.id));
            ops = serverOps.concat(pending);
            remoteLive.clear();
            redraw();
            scheduleLive();
            return pending.map(strip);
        },

        /** A finished op confirmed by the server (mine or someone else's). */
        commit(op) {
            remoteLive.delete(op.id);
            const idx = ops.findIndex((o) => o.id === op.id);
            if (idx >= 0) {
                ops[idx] = op;
                if (!isSortedAt(idx)) {
                    ops.sort(byQ);
                    redraw();
                }
            } else {
                ops.push(op);
                if (isSortedAt(ops.length - 1)) {
                    drawOp(base, op, false);
                    if (op.t === 'clear') ops = [op];
                } else {
                    ops.sort(byQ);
                    redraw();
                }
            }
            scheduleLive();
        },

        remove(id) {
            const idx = ops.findIndex((o) => o.id === id);
            if (idx < 0) return;
            ops.splice(idx, 1);
            redraw();
        },

        restore(op) {
            if (ops.some((o) => o.id === op.id)) return;
            ops.push(op);
            ops.sort(byQ);
            redraw();
        },

        remoteLive(msg) {
            let op = remoteLive.get(msg.id);
            if (!op) {
                op = { id: msg.id, t: msg.t, c: msg.c, s: msg.s, p: [] };
                remoteLive.set(msg.id, op);
            }
            if (msg.p) op.p = msg.p;
            else if (msg.a) for (const n of msg.a) op.p.push(n);
            scheduleLive();
        },

        remoteLiveEnd(id) {
            remoteLive.delete(id);
            scheduleLive();
        },

        clearRemoteLive() {
            remoteLive.clear();
            scheduleLive();
        },

        setCanDraw(value) {
            canDraw = value;
            if (!value) cancelStroke();
            stage.classList.toggle('can-draw', value);
        },

        exportImage() {
            const out = document.createElement('canvas');
            out.width = W;
            out.height = H;
            const ctx = out.getContext('2d');
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, W, H);
            ctx.drawImage(baseCanvas, 0, 0);
            return out.toDataURL('image/png');
        },
    };
})();
