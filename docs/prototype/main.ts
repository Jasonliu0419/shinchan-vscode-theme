import data from './sprites3.json';
import { buildScene, SCENE_H, FEET_Y } from './scene';
type Set = { legend: Record<string, string>; faces: 'left' | 'right' | 'front'; frames: string[][]; durations: number[]; anchor: number };
const sets = data as unknown as Record<string, Set>;
const SCALE = 3;
const cache = new Map<string, HTMLCanvasElement>();
function img(set: string, fi: number, flip: boolean) {
  const k = `${set}:${fi}:${flip}`; let c = cache.get(k); if (c) return c; const s = sets[set]!; const rows = s.frames[fi]!;
  c = document.createElement('canvas'); c.width = rows[0]!.length; c.height = rows.length; const g = c.getContext('2d')!;
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = s.legend[ch]!; g.fillRect(flip ? c!.width - 1 - x : x, y, 1, 1); } }));
  cache.set(k, c); return c;
}
const canvas = document.getElementById('buddy') as HTMLCanvasElement; const ctx = canvas.getContext('2d')!;
const panel = document.getElementById('scene')!; let W = 0;
function resize() { W = Math.floor(panel.clientWidth / SCALE); const d = devicePixelRatio; canvas.width = W * SCALE * d; canvas.height = SCENE_H * SCALE * d; canvas.style.width = W * SCALE + 'px'; canvas.style.height = SCENE_H * SCALE + 'px'; ctx.setTransform(SCALE * d, 0, 0, SCALE * d, 0, 0); ctx.imageSmoothingEnabled = false; }
resize();
type F = [string, number, number, number?, number?]; // set, frameIndex, ms, dx, dy
const seq = (set: string, k = 1, reps = 1): F[] => Array.from({ length: reps }, () => sets[set]!.durations.map((d, i): F => [set, i, Math.round(d * k)])).flat();
const clips: Record<string, { frames: F[]; loop?: boolean }> = {
  idle: { frames: [['front34', 0, 700], ['front34', 0, 700, 0, 1]], loop: true },
  walk: { frames: [['side', 0, 200], ['side', 0, 200, 0, -1]], loop: true },
  greet: { frames: seq('greet', 1, 2) },
  beam: { frames: seq('beam', 1.5) },
  wiggle: { frames: Array.from({ length: 12 }, (_, i): F => ['butt', 0, 200, i % 2 ? 1 : -1]) },
  sleep: { frames: seq('sleep', 1.4), loop: true },
  jump: { frames: [['wave', 0, 120, 0, -2], ['wave', 0, 120, 0, -4], ['wave', 0, 120, 0, -2], ['wave', 0, 120, 0, 0]] },
};
const lines: Record<string, string> = { greet: '欸欸～大姊姊～', beam: '動感光波～逼逼逼～!', wiggle: '噗哩噗哩～', sleep: '晚安～', jump: '嘿嘿～陪我玩嘛～' };
let mode = 'walk', start = performance.now(), x = 20, dir = 1, last = performance.now(), night = false;
const bubble = document.getElementById('speech')!; let bubbleUntil = 0;
function say(t: string) { bubble.textContent = t; bubble.hidden = false; bubbleUntil = performance.now() + 2500 + 120 * t.length; }
function play(m: string) { mode = m; start = performance.now(); night = m === 'sleep'; say(lines[m]!); }
document.querySelectorAll<HTMLButtonElement>('button[data-a]').forEach(b => b.onclick = () => play(b.dataset.a!));
canvas.onclick = () => play(mode === 'sleep' ? 'walk' : 'jump');
let bg: HTMLCanvasElement | null = null, bgKey = '';
function frame(now: number) {
  const dt = now - last; last = now;
  if (panel.clientWidth !== W * SCALE) resize();
  let clip = clips[mode]!; let total = clip.frames.reduce((a, f) => a + f[2], 0); let el = now - start;
  if (!clip.loop && el >= total) { mode = 'walk'; start = now; el = 0; night = false; clip = clips.walk!; total = 400; }
  if (mode === 'walk') { x += dir * 8 * dt / 1000; if (x > W - 14) { x = W - 14; dir = -1; } if (x < 12) { x = 12; dir = 1; } }
  let t = clip.loop ? el % total : el, fr = clip.frames[0]!;
  for (const f of clip.frames) { if (t < f[2]) { fr = f; break; } t -= f[2]; }
  const [set, fi, , dx = 0, dy = 0] = fr; const s = sets[set]!; const rows = s.frames[fi]!; const w = rows[0]!.length, h = rows.length;
  const key = W + ':' + night;
  if (key !== bgKey) { bg = document.createElement('canvas'); bg.width = W; bg.height = SCENE_H; const g = bg.getContext('2d')!; for (const r of buildScene(W, night)) { g.fillStyle = r.c; g.fillRect(r.x, r.y, r.w, r.h); } bgKey = key; }
  ctx.clearRect(0, 0, W, SCENE_H); ctx.drawImage(bg!, 0, 0);
  const flip = (s.faces === 'left' && dir > 0) || (s.faces === 'right' && dir < 0);
  const cx = Math.round(x); const anchor = flip ? w - 1 - s.anchor : s.anchor;
  const px = Math.round(cx - anchor) + dx, py = FEET_Y - h + 1 + dy;
  ctx.fillStyle = 'rgba(40,30,60,.18)'; ctx.fillRect(cx - 7, FEET_Y + 1, 14, 1);
  ctx.drawImage(img(set, fi, flip), px, py);
  if (set === 'beam') extendBeam(s, rows, flip, px, py, w);
  if (now > bubbleUntil) bubble.hidden = true; else { bubble.style.left = cx * SCALE + 'px'; bubble.style.top = (FEET_Y - 31) * SCALE + 'px'; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
/** Beam rows that reach the sprite's outer edge keep going to the edge of the scene. */
function extendBeam(s: Set, rows: string[], flip: boolean, px: number, py: number, w: number) {
  rows.forEach((r, y) => {
    const ch = r[0]!; if (ch === '.' || ch === 'A') return;
    ctx.fillStyle = s.legend[ch]!;
    if (flip) ctx.fillRect(px + w, py + y, Math.max(0, W - px - w), 1); else ctx.fillRect(0, py + y, Math.max(0, px), 1);
  });
}
const sheet = document.getElementById('sheet')!;
for (const [name, s] of Object.entries(sets)) s.frames.forEach((rows, i) => { const c = document.createElement('canvas'); const k = 3; c.width = rows[0]!.length * k; c.height = rows.length * k; const g2 = c.getContext('2d')!; g2.imageSmoothingEnabled = false; g2.drawImage(img(name, i, false), 0, 0, c.width, c.height); const f = document.createElement('figure'); const cap = document.createElement('figcaption'); cap.textContent = `${name} ${i}`; f.append(c, cap); sheet.append(f); });
