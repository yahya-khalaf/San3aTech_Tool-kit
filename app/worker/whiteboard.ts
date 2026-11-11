// Shared whiteboard rooms. One Durable Object instance per board, addressed
// by the room id in the share link. The DO:
//   - relays in-progress strokes to everyone live (not persisted),
//   - persists every finished action (stroke / shape / clear) in its SQLite
//     storage, so late joiners and page refreshes get the full board,
//   - keeps a per-author undo/redo history (last UNDO_LIMIT actions),
//   - enforces the instructor's "students can draw" toggle server-side.
//
// The instructor is whoever holds the room's secret key (generated when the
// board is created and kept in the instructor's browser). Everyone else who
// opens the link is a student.

import { DurableObject } from 'cloudflare:workers';
import { timingSafeEqual } from './session';

const UNDO_LIMIT = 50;
const MAX_OPS = 30_000;
const MAX_POINTS = 20_000; // numbers per stroke (x,y pairs => 10k points)
const MAX_LIVE_POINTS = 4_000;
const INIT_CHUNK = 400;
const INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000; // delete boards unused for 30 days
const COORD_MIN = -2000;
const COORD_MAX = 4000;

const FREEHAND = new Set(['pen', 'eraser']);
const SHAPES = new Set(['rect', 'circle', 'line', 'arrow']);
const ID_RE = /^[A-Za-z0-9_-]{6,40}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

type Role = 'instructor' | 'student';
interface Attachment {
  role: Role;
  author: string;
  cid: string;
}

interface Op {
  id: string;
  t: string;
  c?: string;
  s?: number;
  p?: number[];
}

function isCoordArray(value: unknown, maxLen: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length % 2 === 0 &&
    value.length <= maxLen &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= COORD_MIN && n <= COORD_MAX)
  );
}

function roundCoords(p: number[]): number[] {
  return p.map((n) => Math.round(n * 10) / 10);
}

function sanitizeStyle(raw: Record<string, unknown>): { id: string; t: string; c: string; s: number } | null {
  const { id, t, c, s } = raw;
  if (typeof id !== 'string' || !ID_RE.test(id)) return null;
  if (typeof t !== 'string' || !(FREEHAND.has(t) || SHAPES.has(t))) return null;
  if (typeof c !== 'string' || !COLOR_RE.test(c)) return null;
  if (typeof s !== 'number' || !Number.isFinite(s) || s < 1 || s > 100) return null;
  return { id, t, c, s: Math.round(s) };
}

function sanitizeOp(raw: unknown): Op | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.t === 'clear') {
    return typeof r.id === 'string' && ID_RE.test(r.id) ? { id: r.id, t: 'clear' } : null;
  }
  const style = sanitizeStyle(r);
  if (!style) return null;
  if (FREEHAND.has(style.t)) {
    if (!isCoordArray(r.p, MAX_POINTS) || r.p.length < 2) return null;
  } else if (!isCoordArray(r.p, 4) || r.p.length !== 4) {
    return null;
  }
  return { ...style, p: roundCoords(r.p) };
}

export class WhiteboardRoom extends DurableObject<object> {
  private sql: SqlStorage;
  private lastTouch = 0;

  constructor(ctx: DurableObjectState, env: object) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.migrate();
    // Keep-alive pings are answered without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private migrate() {
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)');
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS ops (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        author TEXT NOT NULL,
        kind TEXT NOT NULL,
        data TEXT NOT NULL,
        undone INTEGER NOT NULL DEFAULT 0,
        undone_at INTEGER
      )`
    );
    this.sql.exec('CREATE INDEX IF NOT EXISTS ops_author ON ops(author, seq)');
  }

  private getMeta(k: string): string | null {
    const row = this.sql.exec('SELECT v FROM meta WHERE k = ?', k).toArray()[0];
    return row ? String(row.v) : null;
  }

  private setMeta(k: string, v: string) {
    this.sql.exec('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', k, v);
  }

  private studentsCanEdit(): boolean {
    return this.getMeta('studentsCanEdit') === '1';
  }

  /** Sequence number of the most recent active "clear"; everything before it is invisible. */
  private floorSeq(): number {
    const row = this.sql.exec("SELECT MAX(seq) AS s FROM ops WHERE kind = 'clear' AND undone = 0").toArray()[0];
    return row && row.s !== null ? Number(row.s) : 0;
  }

  private async touch() {
    const now = Date.now();
    if (now - this.lastTouch < 60 * 60 * 1000) return;
    this.lastTouch = now;
    await this.ctx.storage.setAlarm(now + INACTIVITY_MS);
  }

  /** Called once by the Worker when a board is created. */
  async init(key: string): Promise<boolean> {
    if (this.getMeta('key')) return false;
    this.setMeta('key', key);
    this.setMeta('studentsCanEdit', '0');
    this.setMeta('created', String(Date.now()));
    await this.touch();
    return true;
  }

  async alarm() {
    if (this.ctx.getWebSockets().length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + INACTIVITY_MS);
      return;
    }
    await this.ctx.storage.deleteAll();
    this.migrate();
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const { 0: client, 1: server } = new WebSocketPair();
    const storedKey = this.getMeta('key');

    if (!storedKey) {
      server.accept();
      server.send(JSON.stringify({ type: 'error', code: 'not_found' }));
      server.close(4404, 'Board not found');
      return new Response(null, { status: 101, webSocket: client });
    }

    const cidParam = url.searchParams.get('client') ?? '';
    const cid = ID_RE.test(cidParam) ? cidParam : crypto.randomUUID().replace(/-/g, '');
    const key = url.searchParams.get('key') ?? '';
    const role: Role = key && timingSafeEqual(key, storedKey) ? 'instructor' : 'student';
    const att: Attachment = { role, author: role === 'instructor' ? 'instructor' : `s:${cid}`, cid };

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(att);
    this.sendInit(server, att);
    this.broadcastPresence();
    return new Response(null, { status: 101, webSocket: client });
  }

  private sendInit(ws: WebSocket, att: Attachment) {
    const rows = this.sql
      .exec('SELECT seq, data FROM ops WHERE undone = 0 AND seq >= ? ORDER BY seq', this.floorSeq())
      .toArray();
    ws.send(
      JSON.stringify({ type: 'init', role: att.role, studentsCanEdit: this.studentsCanEdit(), total: rows.length })
    );
    for (let i = 0; i < rows.length; i += INIT_CHUNK) {
      const ops = rows.slice(i, i + INIT_CHUNK).map((r) => ({ ...JSON.parse(String(r.data)), q: Number(r.seq) }));
      ws.send(JSON.stringify({ type: 'ops', ops }));
    }
    ws.send(JSON.stringify({ type: 'ready' }));
    this.sendHistoryTo(ws, att.author);
  }

  private sockets(): { ws: WebSocket; att: Attachment }[] {
    const out: { ws: WebSocket; att: Attachment }[] = [];
    for (const ws of this.ctx.getWebSockets()) {
      const att = ws.deserializeAttachment() as Attachment | null;
      if (att) out.push({ ws, att });
    }
    return out;
  }

  private broadcast(message: unknown, except?: WebSocket) {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    for (const { ws } of this.sockets()) {
      if (ws === except) continue;
      try {
        ws.send(data);
      } catch {
        // socket already closing
      }
    }
  }

  private broadcastPresence(leaving?: WebSocket) {
    let students = 0;
    let instructors = 0;
    for (const { ws, att } of this.sockets()) {
      if (ws === leaving) continue;
      if (att.role === 'instructor') instructors++;
      else students++;
    }
    this.broadcast({ type: 'presence', students, instructors }, leaving);
  }

  private history(author: string) {
    const floor = this.floorSeq();
    const recent = this.sql
      .exec('SELECT seq, undone FROM ops WHERE author = ? ORDER BY seq DESC LIMIT ?', author, UNDO_LIMIT)
      .toArray();
    const undo = recent.filter((r) => Number(r.undone) === 0 && Number(r.seq) >= floor).length;
    const redoRow = this.sql.exec('SELECT COUNT(*) AS n FROM ops WHERE author = ? AND undone = 1', author).one();
    return { type: 'history', undo, redo: Number(redoRow.n) };
  }

  private sendHistoryTo(ws: WebSocket, author: string) {
    try {
      ws.send(JSON.stringify(this.history(author)));
    } catch {
      // ignore
    }
  }

  /** Refresh undo/redo counts for one author, or for everyone when author is omitted. */
  private sendHistory(author?: string) {
    const cache = new Map<string, string>();
    for (const { ws, att } of this.sockets()) {
      if (author && att.author !== author) continue;
      let data = cache.get(att.author);
      if (!data) {
        data = JSON.stringify(this.history(att.author));
        cache.set(att.author, data);
      }
      try {
        ws.send(data);
      } catch {
        // ignore
      }
    }
  }

  private resyncAll() {
    for (const { ws, att } of this.sockets()) this.sendInit(ws, att);
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string' || message.length > 600_000) return;
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object') return;

    const att = ws.deserializeAttachment() as Attachment | null;
    if (!att) return;
    const isInstructor = att.role === 'instructor';
    const canEdit = isInstructor || this.studentsCanEdit();

    switch (msg.type) {
      case 'live': {
        if (!canEdit) return;
        const style = sanitizeStyle(msg);
        if (!style) return;
        const out: Record<string, unknown> = { type: 'live', ...style };
        if (FREEHAND.has(style.t) && isCoordArray(msg.a, MAX_LIVE_POINTS)) out.a = roundCoords(msg.a);
        else if (SHAPES.has(style.t) && isCoordArray(msg.p, 4) && msg.p.length === 4) out.p = roundCoords(msg.p);
        else return;
        this.broadcast(out, ws);
        return;
      }

      case 'live-end': {
        if (typeof msg.id === 'string' && ID_RE.test(msg.id)) this.broadcast({ type: 'live-end', id: msg.id }, ws);
        return;
      }

      case 'commit': {
        const op = sanitizeOp(msg.op);
        const rawId = (msg.op as { id?: unknown } | undefined)?.id;
        const reject = (reason: string) =>
          ws.send(JSON.stringify({ type: 'reject', id: typeof rawId === 'string' ? rawId : '', reason }));
        if (!op) return reject('invalid');
        if (!canEdit || (op.t === 'clear' && !isInstructor)) return reject('locked');

        // Re-sent after a reconnect: already stored, nothing to do.
        if (this.sql.exec('SELECT 1 FROM ops WHERE id = ?', op.id).toArray().length) return;

        const count = Number(this.sql.exec('SELECT COUNT(*) AS n FROM ops').one().n);
        if (count >= MAX_OPS) return reject('full');

        // A new action invalidates this author's redo stack.
        this.sql.exec('DELETE FROM ops WHERE author = ? AND undone = 1', att.author);

        const prevFloor = op.t === 'clear' ? this.floorSeq() : 0;
        const row = this.sql
          .exec('INSERT INTO ops (id, author, kind, data) VALUES (?, ?, ?, ?) RETURNING seq', op.id, att.author, op.t, JSON.stringify(op))
          .one();

        if (op.t === 'clear' && prevFloor > 0) {
          // Keep history back to the previous clear (so this clear can be undone); drop the rest.
          this.sql.exec('DELETE FROM ops WHERE seq < ?', prevFloor);
        }

        this.broadcast({ type: 'op', op: { ...op, q: Number(row.seq) } });
        this.sendHistory(op.t === 'clear' ? undefined : att.author);
        await this.touch();
        return;
      }

      case 'undo': {
        if (!canEdit) return;
        const floor = this.floorSeq();
        const target = this.sql
          .exec('SELECT seq, id, kind, undone FROM ops WHERE author = ? ORDER BY seq DESC LIMIT ?', att.author, UNDO_LIMIT)
          .toArray()
          .find((r) => Number(r.undone) === 0 && Number(r.seq) >= floor);
        if (!target) return this.sendHistoryTo(ws, att.author);

        this.sql.exec('UPDATE ops SET undone = 1, undone_at = ? WHERE seq = ?', Date.now(), target.seq);
        if (target.kind === 'clear') {
          this.resyncAll(); // brings back what the clear had hidden
          this.sendHistory();
        } else {
          this.broadcast({ type: 'remove', id: target.id });
          this.sendHistory(att.author);
        }
        return;
      }

      case 'redo': {
        if (!canEdit) return;
        const row = this.sql
          .exec(
            'SELECT seq, kind, data FROM ops WHERE author = ? AND undone = 1 ORDER BY undone_at DESC, seq DESC LIMIT 1',
            att.author
          )
          .toArray()[0];
        if (!row) return this.sendHistoryTo(ws, att.author);

        this.sql.exec('UPDATE ops SET undone = 0, undone_at = NULL WHERE seq = ?', row.seq);
        this.broadcast({ type: 'restore', op: { ...JSON.parse(String(row.data)), q: Number(row.seq) } });
        this.sendHistory(row.kind === 'clear' ? undefined : att.author);
        return;
      }

      case 'set-permission': {
        if (!isInstructor || typeof msg.studentsCanEdit !== 'boolean') return;
        this.setMeta('studentsCanEdit', msg.studentsCanEdit ? '1' : '0');
        this.broadcast({ type: 'permission', studentsCanEdit: msg.studentsCanEdit });
        return;
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    try {
      ws.close(code === 1005 || code === 1006 ? 1000 : code, reason);
    } catch {
      // already closed
    }
    this.broadcastPresence(ws);
  }

  async webSocketError(ws: WebSocket) {
    this.broadcastPresence(ws);
  }
}
