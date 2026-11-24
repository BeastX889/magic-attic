// Furnished rooms drawn from code. composeRoom() lays out furniture for a scene size and returns the
// surfaces (shelves, tables, sills, floor rows) and hooks that items are placed on; roomCanvas() renders
// the room behind the items ('back') and the parts in front of them ('front': shelf boards, table edges,
// foreground plants, lighting) so items look like they sit in the room instead of floating on it.
import { OUT, circle, ellipse, lg, rg, rrect, star, sparkle, shade } from './art.js';

let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const cache = new Map();

// ---------- themes ----------
const T = {
  attic: {
    cols: ['bookcase', 'pegs', 'window', 'wallshelf', 'bookcase', 'pegs'],
    wood: '#a8683c', woodD: '#6e3e22', back: '#4a2818', metal: '#c9a25a', cloth: '#c8504a', cloth2: '#f0c060',
    light: 'rgba(255,200,120,0.10)', fg: 'cobweb',
  },
  kitchen: {
    cols: ['wallshelf', 'stove', 'window', 'pegs', 'wallshelf', 'stove'],
    wood: '#c88a4a', woodD: '#8a5428', back: '#7a4626', metal: '#5a5070', cloth: '#e8384c', cloth2: '#fff0dc',
    light: 'rgba(255,230,170,0.08)', fg: 'lights',
  },
  garden: {
    cols: ['bench', 'pegs', 'wallshelf', 'bench', 'stump', 'pegs'],
    wood: '#9a7048', woodD: '#5e4228', back: '#3a2a1c', metal: '#8a8aa0', cloth: '#4aa05a', cloth2: '#ff8ac8',
    light: 'rgba(150,170,255,0.08)', fg: 'grass',
  },
  library: {
    cols: ['bookcase', 'window', 'bookcase', 'pegs', 'bookcase', 'wallshelf'],
    wood: '#8a5428', woodD: '#5a3418', back: '#2e1a24', metal: '#ffcf3a', cloth: '#a8304a', cloth2: '#ffcf3a',
    light: 'rgba(255,210,140,0.08)', fg: 'cobweb',
  },
  lab: {
    cols: ['wallshelf', 'bookcase', 'cauldron', 'window', 'wallshelf', 'bookcase'],
    wood: '#7a5634', woodD: '#4a3220', back: '#221a34', metal: '#7a7a98', cloth: '#5a3a8a', cloth2: '#7dff9a',
    light: 'rgba(125,255,154,0.06)', fg: 'vines',
  },
  bedroom: {
    cols: ['window', 'bed', 'pegs', 'wallshelf', 'bed', 'bookcase'],
    wood: '#b07a50', woodD: '#7a4a2a', back: '#5a3a6a', metal: '#ffcf3a', cloth: '#7a4ad8', cloth2: '#ff9ad0',
    light: 'rgba(255,220,240,0.08)', fg: 'lights',
  },
};

// ---------- layout ----------
export function composeRoom(theme, w, h, variant = 0) {
  const th = T[theme] ? theme : 'attic', P = T[th];
  seed = 1009 + w * 7 + h * 13 + variant * 977 + th.length * 31;
  const floorH = Math.round(Math.max(180, Math.min(290, h * 0.27))), floorY = h - floorH;
  const n = Math.max(2, Math.round(w / 285)), cw = w / n;
  const pieces = [], surfaces = [], hangs = [];
  const surf = (x0, x1, y, s = 1) => { if (x1 - x0 > 50) surfaces.push({ x0, x1, y, s }); };
  // Tall portrait rooms leave bare wall between a piece's top and bottom parts: fill it with extra wall
  // shelves spread evenly from y=lo to y=hi, at least 170 apart. Returns how many were added.
  const tall = floorY > 640;
  const fill = (p, a, b, lo, hi) => {
    if (!tall || hi < lo) return 0;
    const n = Math.floor((hi - lo) / 170) + 1;
    p.extra = p.extra || [];
    for (let k = 0; k < n; k++) {
      const y = Math.round(n === 1 ? (lo + hi) / 2 : lo + (hi - lo) * k / (n - 1));
      p.extra.push({ a, b, y }); surf(a + 6, b - 6, y, 0.95);
    }
    return n;
  };
  for (let i = 0; i < n; i++) {
    const type = P.cols[(i + variant * 2) % P.cols.length];
    const x0 = Math.round(i * cw + 12), x1 = Math.round((i + 1) * cw - 12), pw = x1 - x0, mid = (x0 + x1) / 2;
    const p = { type, x: x0, w: pw };
    if (type === 'bookcase') {
      p.top = Math.round(36 + rnd() * 40); p.bot = floorY + 16;
      const nS = Math.max(2, Math.floor((p.bot - p.top - 24) / 152)), gap = (p.bot - p.top - 24) / nS;
      p.shelves = []; p.books = [];
      for (let k = 0; k < nS; k++) {
        const y = Math.round(p.top + 12 + gap * (k + 1));
        p.shelves.push(y);
        let a = x0 + 16, b = x1 - 16;
        if (rnd() < 0.55) {   // a stack of books at one end of the shelf
          const bw = Math.round(pw * (0.26 + rnd() * 0.16)), left = rnd() < 0.5;
          p.books.push({ x: left ? a : b - bw, y, w: bw, h: gap * 0.62 });
          if (left) a += bw + 6; else b -= bw + 6;
        }
        surf(a, b, y);
      }
      if (p.top > 60) surf(x0 + 10, x1 - 10, p.top - 12, 0.95);
    } else if (type === 'wallshelf' || type === 'cauldron') {
      const ys = floorY > 640 ? [0.24, 0.46, 0.68] : [0.3, 0.62];
      p.shelves = ys.map((f, k) => {
        const inset = rnd() * pw * 0.12, a = x0 + 6 + (k % 2 ? inset : 0), b = x1 - 6 - (k % 2 ? 0 : inset);
        const y = Math.round(floorY * f);
        surf(a + 6, b - 6, y);
        return { a, b, y };
      });
      if (type === 'wallshelf') {
        p.chest = { x: mid - pw * 0.36, w: pw * 0.72, y: floorY - 74, h: 92 };
        surf(p.chest.x + 8, p.chest.x + p.chest.w - 8, p.chest.y, 0.95);
      } else p.pot = { x: mid, y: floorY + 4, r: Math.min(pw * 0.4, 120) };
    } else if (type === 'window') {
      const ww = Math.min(pw * 0.7, 210), wy0 = 54, wy1 = Math.round(Math.max(200, floorY * 0.44));
      p.win = { x: mid - ww / 2, y: wy0, w: ww, h: wy1 - wy0, round: th === 'attic' };
      surf(p.win.x - 18, p.win.x + ww + 18, wy1 + 6, 0.9);
      p.dresser = { x: x0 + 8, w: pw - 16, y: floorY - 150, h: 168 };
      surf(x0 + 14, x1 - 14, floorY - 150);
      fill(p, x0 + pw * 0.1, x1 - pw * 0.1, wy1 + 6 + 127, p.dresser.y - 150);
    } else if (type === 'pegs') {
      p.rail = { y: 92 + Math.round(rnd() * 30) };
      const np = Math.max(2, Math.round(pw / 90));
      p.pegs = [];
      for (let k = 0; k < np; k++) { const x = x0 + pw * (k + 0.5) / np; p.pegs.push(x); hangs.push({ x, y: p.rail.y + 10 }); }
      p.table = { x: x0 + 4, w: pw - 8, y: floorY - 124 };
      surf(x0 + 10, x1 - 10, p.table.y);
      const gapY = p.table.y - p.rail.y;
      if (!fill(p, x0 + pw * 0.12, x1 - pw * 0.12, p.rail.y + 215, p.table.y - 150) && gapY > 330) { p.shelf = { a: x0 + pw * 0.12, b: x1 - pw * 0.12, y: Math.round(p.rail.y + 130 + (gapY - 130) * 0.5) }; surf(p.shelf.a + 6, p.shelf.b - 6, p.shelf.y, 0.95); }
    } else if (type === 'stove') {
      p.stove = { x: x0 + 10, w: pw - 20, y: floorY - 160 };
      surf(p.stove.x + 8, p.stove.x + p.stove.w - 8, p.stove.y);
      p.hood = { y: 40, h: Math.round(Math.min(150, floorY * 0.22)) };
      const sy = Math.round((p.hood.y + p.hood.h + p.stove.y) / 2 + 30);
      if (!fill(p, x0 + 6, x1 - 6, p.hood.y + p.hood.h + 115, p.stove.y - 150) && p.stove.y - (p.hood.y + p.hood.h) > 230) { p.shelf = { a: x0 + 6, b: x1 - 6, y: sy }; surf(x0 + 12, x1 - 12, sy, 0.95); }
    } else if (type === 'bed') {
      p.bed = { x: x0 - 4, w: pw + 8, y: floorY - 64 };
      surf(x0 + 30, x1 - 10, p.bed.y + 4, 1.05);
      if (!fill(p, x0 + 10, x1 - 10, 170, p.bed.y - 200)) {
        p.shelf = { a: x0 + 10, b: x1 - 10, y: Math.round(floorY * 0.34) };
        surf(x0 + 16, x1 - 16, p.shelf.y, 0.95);
      }
    } else if (type === 'bench') {
      p.bench = { x: x0 + 6, w: pw - 12, y: floorY - 140, low: floorY - 34 };
      surf(x0 + 14, x1 - 14, p.bench.y);
      p.rail = { y: Math.round(floorY * 0.3) };
      p.pegs = [x0 + pw * 0.3, x0 + pw * 0.7];
      for (const x of p.pegs) hangs.push({ x, y: p.rail.y + 10 });
      fill(p, x0 + 14, x1 - 14, p.rail.y + 215, p.bench.y - 150);
    } else if (type === 'stump') {
      p.stump = { x: mid, y: floorY - 70, r: Math.min(pw * 0.38, 105) };
      surf(mid - p.stump.r * 0.85, mid + p.stump.r * 0.85, p.stump.y);
      p.lantern = { x: mid, y: Math.round(floorY * 0.28) };
      fill(p, x0 + pw * 0.08, x1 - pw * 0.08, p.lantern.y + 150, p.stump.y - 150);
    }
    pieces.push(p);
  }
  // floor: two depth rows, the front one a little bigger
  surfaces.push({ x0: 16, x1: w - 16, y: Math.round(floorY + floorH * 0.44), s: 1.06, floor: true });
  surfaces.push({ x0: 16, x1: w - 16, y: Math.round(floorY + floorH * 0.88), s: 1.16, floor: true });
  return { key: `${th}:${w}x${h}:${variant}`, theme: th, w, h, floorY, floorH, pieces, surfaces, hangs };
}

// ---------- canvases ----------
export function roomCanvas(R, layer, res) {
  const { w, h } = R;
  res = Math.min(res, Math.sqrt(10e6 / (w * h)));   // iOS caps canvas area (~16.7M px); two layers stay below it
  const key = `${R.key}:${layer}@${res.toFixed(2)}`;
  let c = cache.get(key);
  if (!c) {
    if (cache.size >= 4) cache.clear();   // back+front for at most two zoom tiers
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * res)); c.height = Math.max(1, Math.round(h * res));
    const g = c.getContext('2d');
    g.scale(res, res); g.lineJoin = 'round'; g.lineCap = 'round';
    seed = 777 + w + h * 3 + R.theme.length * 31;
    if (layer === 'back') drawBack(g, R); else drawFront(g, R);
    cache.set(key, c);
  }
  return c;
}

function drawBack(g, R) {
  const P = T[R.theme];
  WALLS[R.theme](g, R, P);
  for (const p of R.pieces) { BACK[p.type]?.(g, p, R, P); extraBack(g, p, R, P); }
  // soft depth: the wall darkens towards the floor line
  g.fillStyle = lg(g, 0, R.floorY - 120, 0, R.floorY + 6, [[0, 'rgba(20,8,30,0)'], [1, 'rgba(20,8,30,0.22)']]);
  g.fillRect(0, R.floorY - 120, R.w, 126);
}
function drawFront(g, R) {
  const P = T[R.theme];
  for (const p of R.pieces) { FRONT[p.type]?.(g, p, R, P); for (const s of p.extra || []) board(g, s.a, s.y - 4, s.b - s.a, 16, P, 4); }
  FG[P.fg]?.(g, R, P);
  // lighting over everything, so items take on the room's light instead of looking pasted on
  g.fillStyle = P.light; g.fillRect(0, 0, R.w, R.h);
  g.fillStyle = rg(g, R.w / 2, R.h * 0.45, Math.min(R.w, R.h) * 0.45, Math.hypot(R.w, R.h) * 0.62, [[0, 'rgba(15,5,30,0)'], [1, 'rgba(15,5,30,0.42)']]);
  g.fillRect(0, 0, R.w, R.h);
}

// extra wall shelves of tall rooms (outdoors they stand on posts)
function extraBack(g, p, R, P) {
  for (const s of p.extra || []) {
    posts(g, R, P, [s.a + 4, s.b - 20], s.y);
    shadowUnder(g, s.a, s.y + 12, s.b - s.a, 0.25); bracket(g, s.a + 22, s.y + 10, P); bracket(g, s.b - 22, s.y + 10, P);
  }
}

// ---------- drawing helpers ----------
function board(g, x, y, w, h, P, r = 4) {
  rrect(g, x, y, w, h, r); g.fillStyle = lg(g, 0, y, 0, y + h, [[0, shade(P.wood, 0.25)], [1, P.wood]]); g.fill();
  g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
  g.fillStyle = 'rgba(255,240,210,0.28)'; g.fillRect(x + 6, y + 3, w - 12, 3);
}
function planks(g, x, y, w, h, a, b, vertical, step) {
  g.fillStyle = lg(g, 0, y, 0, y + h, [[0, a], [1, b]]); g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(30,10,10,0.35)'; g.lineWidth = 3; g.beginPath();
  if (vertical) for (let px = x + step; px < x + w; px += step) { g.moveTo(px, y); g.lineTo(px, y + h); }
  else for (let py = y + step; py < y + h; py += step) { g.moveTo(x, py); g.lineTo(x + w, py); const off = rnd() * w; g.moveTo(x + off, py - step); g.lineTo(x + off, py); }
  g.stroke();
  // wood grain knots
  g.fillStyle = 'rgba(30,10,10,0.18)';
  for (let k = 0; k < (w * h) / 9000; k++) { ellipse(g, x + rnd() * w, y + rnd() * h, 6 + rnd() * 6, 2 + rnd() * 2); g.fill(); }
}
function books(g, x0, y, w, hMax) {
  let x = x0;
  const cols = ['#e8584a', '#3a9ae8', '#4cc35a', '#ffcf3a', '#a877e8', '#ff8ac8', '#f08a2a', '#2a6a8a'];
  while (x < x0 + w - 12) {
    const bw = Math.min(12 + rnd() * 14, x0 + w - x), bh = hMax * (0.6 + rnd() * 0.4);
    const lean = rnd() < 0.12 && x > x0 + 20;
    g.save(); if (lean) { g.translate(x, y); g.rotate(-0.22); g.translate(-x, -y); }
    rrect(g, x, y - bh, bw, bh, 3); g.fillStyle = shade(cols[Math.floor(rnd() * cols.length)], -0.2); g.fill();
    g.strokeStyle = 'rgba(20,10,30,0.7)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,240,200,0.45)'; g.fillRect(x + 3, y - bh * 0.78, bw - 6, 3); g.fillRect(x + 3, y - bh * 0.3, bw - 6, 2);
    g.restore();
    x += bw + 1 + (lean ? 8 : 0);
  }
}
function shadowUnder(g, x, y, w, a = 0.35) {
  g.fillStyle = lg(g, 0, y, 0, y + 22, [[0, `rgba(15,5,25,${a})`], [1, 'rgba(15,5,25,0)']]); g.fillRect(x, y, w, 22);
}
function nightSky(g, x, y, w, h) {
  g.fillStyle = lg(g, 0, y, 0, y + h, [[0, '#1d1440'], [1, '#5a4aa0']]); g.fillRect(x, y, w, h);
  for (let k = 0; k < 10; k++) sparkle(g, x + rnd() * w, y + rnd() * h, 2 + rnd() * 3, '#fff6dc');
  const r = Math.min(w, h) * 0.16;
  circle(g, x + w * 0.66, y + h * 0.3, r); g.fillStyle = '#fff4c8'; g.fill();
  circle(g, x + w * 0.66 + r * 0.4, y + h * 0.3 - r * 0.25, r * 0.85); g.fillStyle = '#4a3a8a'; g.fill();
}
function bracket(g, x, y, P) {
  g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.lineTo(x + 6, y + 34); g.closePath();
  g.fillStyle = P.metal; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
}

// ---------- walls + floors ----------
const WALLS = {
  attic(g, R) {
    const { w, h, floorY } = R;
    planks(g, 0, 0, w, floorY, '#8a5440', '#5e3424', true, 64);
    g.fillStyle = '#3e2018';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.22, 0); g.lineTo(0, floorY * 0.36); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(w, 0); g.lineTo(w * 0.78, 0); g.lineTo(w, floorY * 0.36); g.closePath(); g.fill();
    g.fillStyle = '#4e2a1c'; g.fillRect(0, 18, w, 22); g.strokeStyle = OUT; g.lineWidth = 3; g.strokeRect(-2, 18, w + 4, 22);
    planks(g, 0, floorY, w, h - floorY, '#b07240', '#7a4626', false, 40);
    g.fillStyle = 'rgba(255,255,255,0.16)';
    for (let k = 0; k < 50; k++) { circle(g, rnd() * w, rnd() * floorY, 1 + rnd() * 2); g.fill(); }
  },
  kitchen(g, R) {
    const { w, h, floorY } = R, Tl = 44;
    for (let y = 0; y < floorY; y += Tl) for (let x = 0; x < w; x += Tl) { g.fillStyle = ((x + y) / Tl) % 2 ? '#f6e7c8' : '#ecd6ae'; g.fillRect(x, y, Tl, Tl); }
    g.strokeStyle = 'rgba(120,80,40,0.18)'; g.lineWidth = 2; g.beginPath();
    for (let y = Tl; y < floorY; y += Tl) { g.moveTo(0, y); g.lineTo(w, y); }
    for (let x = Tl; x < w; x += Tl) { g.moveTo(x, 0); g.lineTo(x, floorY); }
    g.stroke();
    g.fillStyle = '#a86a3a'; g.fillRect(0, floorY - 12, w, 12);
    for (let y = floorY; y < h; y += 60) for (let x = 0; x < w; x += 60) { g.fillStyle = ((x + y) / 60 | 0) % 2 ? '#fff0dc' : '#d85a4a'; g.fillRect(x, y, 60, 60); }
  },
  garden(g, R) {
    const { w, h, floorY } = R;
    g.fillStyle = lg(g, 0, 0, 0, floorY, [[0, '#141a46'], [1, '#3a4a8a']]); g.fillRect(0, 0, w, floorY);
    for (let k = 0; k < 80; k++) sparkle(g, rnd() * w, rnd() * floorY * 0.6, 1.5 + rnd() * 3.5, '#fff6dc');
    g.fillStyle = rg(g, w * 0.82, 90, 10, 200, [[0, 'rgba(255,244,200,0.45)'], [1, 'rgba(255,244,200,0)']]); g.fillRect(0, 0, w, 320);
    circle(g, w * 0.82, 90, 44); g.fillStyle = '#fff4c8'; g.fill();
    // hedge
    const hy = floorY - Math.min(320, floorY * 0.5);
    g.fillStyle = '#24503e';
    g.beginPath(); g.moveTo(0, floorY);
    for (let x = 0; x <= w + 60; x += 60) g.quadraticCurveTo(x - 30, hy - 30 - rnd() * 30, x, hy + rnd() * 10);
    g.lineTo(w, floorY); g.closePath(); g.fill();
    g.fillStyle = 'rgba(80,160,110,0.25)';
    for (let k = 0; k < 40; k++) { circle(g, rnd() * w, hy + 20 + rnd() * (floorY - hy - 20), 8 + rnd() * 10); g.fill(); }
    // fence
    const fy = floorY - 170;
    for (let x = 6; x < w; x += 52) {
      g.beginPath(); g.moveTo(x, fy + 16); g.lineTo(x + 17, fy); g.lineTo(x + 34, fy + 16); g.lineTo(x + 34, floorY); g.lineTo(x, floorY); g.closePath();
      g.fillStyle = '#e8dcc8'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
    }
    g.fillStyle = '#d0c2a8'; g.fillRect(0, fy + 40, w, 12); g.fillRect(0, floorY - 50, w, 12);
    g.fillStyle = lg(g, 0, floorY, 0, h, [[0, '#4aa05a'], [1, '#2a6a3a']]); g.fillRect(0, floorY, w, h - floorY);
    for (let k = 0; k < w / 8; k++) { const x = rnd() * w, y = floorY + 8 + rnd() * (h - floorY); g.strokeStyle = '#6ac87a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y - 14); g.moveTo(x, y); g.lineTo(x + 5, y - 12); g.stroke(); }
  },
  library(g, R) {
    const { w, h, floorY } = R;
    g.fillStyle = '#3e2440'; g.fillRect(0, 0, w, floorY);
    for (let x = 0; x < w; x += 46) { g.fillStyle = 'rgba(255,200,120,0.05)'; g.fillRect(x, 0, 23, floorY); }
    for (let y = 30; y < floorY; y += 60) for (let x = (y / 60 % 2) * 23; x < w; x += 46) { star(g, x + 11, y, 5); g.fillStyle = 'rgba(255,207,58,0.12)'; g.fill(); }
    planks(g, 0, floorY - 90, w, 90, '#6a3a26', '#4a2616', true, 70);
    g.fillStyle = '#8a5428'; g.fillRect(0, floorY - 96, w, 10);
    planks(g, 0, floorY, w, h - floorY, '#6a3a26', '#3e1e10', false, 38);
    ellipse(g, w / 2, floorY + (h - floorY) * 0.62, w * 0.42, (h - floorY) * 0.34); g.fillStyle = '#8a2840'; g.fill();
    ellipse(g, w / 2, floorY + (h - floorY) * 0.62, w * 0.36, (h - floorY) * 0.26); g.strokeStyle = '#ffcf3a'; g.lineWidth = 5; g.stroke();
  },
  lab(g, R) {
    const { w, h, floorY } = R;
    g.fillStyle = '#2e2448'; g.fillRect(0, 0, w, floorY);
    g.strokeStyle = 'rgba(10,5,20,0.55)'; g.lineWidth = 3;
    for (let y = 0, row = 0; y < floorY; y += 46, row++) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      for (let x = (row % 2) * 45; x < w; x += 90) { g.fillStyle = `rgba(120,100,180,${0.08 + rnd() * 0.1})`; g.fillRect(x + 2, y + 2, 86, 42); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 46); g.stroke(); }
    }
    g.fillStyle = lg(g, 0, floorY, 0, h, [[0, '#3a2e50'], [1, '#1e1630']]); g.fillRect(0, floorY, w, h - floorY);
    g.strokeStyle = 'rgba(10,5,20,0.5)';
    for (let k = 0; k < w / 50; k++) { ellipse(g, rnd() * w, floorY + 20 + rnd() * (h - floorY - 20), 30 + rnd() * 30, 12 + rnd() * 8); g.stroke(); }
  },
  bedroom(g, R) {
    const { w, h, floorY } = R;
    g.fillStyle = '#a890dc'; g.fillRect(0, 0, w, floorY);
    for (let x = 0; x < w; x += 60) { g.fillStyle = '#b8a4e8'; g.fillRect(x, 0, 30, floorY); }
    for (let y = 40; y < floorY - 60; y += 120) for (let x = 15 + (y / 120 % 2) * 60; x < w; x += 120) { star(g, x, y, 8); g.fillStyle = 'rgba(255,246,200,0.55)'; g.fill(); }
    g.fillStyle = '#f0e6ff'; g.fillRect(0, floorY - 16, w, 16); g.strokeStyle = OUT; g.lineWidth = 3; g.strokeRect(-2, floorY - 16, w + 4, 16);
    planks(g, 0, floorY, w, h - floorY, '#9a6440', '#6a3e22', false, 42);
    ellipse(g, w / 2, floorY + (h - floorY) * 0.6, w * 0.38, (h - floorY) * 0.32); g.fillStyle = '#ff9ad0'; g.fill();
    ellipse(g, w / 2, floorY + (h - floorY) * 0.6, w * 0.3, (h - floorY) * 0.22); g.strokeStyle = '#fff'; g.lineWidth = 6; g.setLineDash([14, 12]); g.stroke(); g.setLineDash([]);
  },
};

// outdoors there is no wall to hang things on: stand shelves and rails on wooden posts
function posts(g, R, P, xs, top) {
  if (R.theme !== 'garden') return;
  for (const x of xs) {
    ellipse(g, x + 8, R.floorY + 22, 22, 7); g.fillStyle = 'rgba(15,5,25,0.3)'; g.fill();
    rrect(g, x, top - 10, 16, R.floorY + 20 - top, 5); g.fillStyle = lg(g, x, 0, x + 16, 0, [[0, P.woodD], [1, P.wood]]); g.fill();
    g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  }
}
// ---------- furniture: behind the items ----------
const BACK = {
  bookcase(g, p, R, P) {
    const { x, w, top, bot } = p;
    rrect(g, x + 6, top - 16 + 8, w, bot - top + 16, 10); g.fillStyle = 'rgba(15,5,25,0.35)'; g.fill();
    rrect(g, x, top - 16, w, bot - top + 16, 10); g.fillStyle = lg(g, x, 0, x + w, 0, [[0, P.woodD], [0.5, P.wood], [1, P.woodD]]); g.fill();
    g.lineWidth = 5; g.strokeStyle = OUT; g.stroke();
    rrect(g, x + 14, top - 2, w - 28, bot - top - 10, 6); g.fillStyle = P.back; g.fill(); g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.04)'; for (let k = 0; k < 4; k++) g.fillRect(x + 20 + k * (w - 40) / 4, top, 3, bot - top - 14);
    for (const y of p.shelves) shadowUnder(g, x + 14, y + 10, w - 28);
    for (const b of p.books) books(g, b.x, b.y, b.w, b.h);
    board(g, x - 8, top - 26, w + 16, 16, P, 6);   // crown
  },
  wallshelf(g, p, R, P) {
    if (p.shelves.length) posts(g, R, P, [p.shelves[0].a + 4, p.shelves[0].b - 20], p.shelves[0].y);
    for (const s of p.shelves) { shadowUnder(g, s.a, s.y + 12, s.b - s.a, 0.25); bracket(g, s.a + 22, s.y + 10, P); bracket(g, s.b - 22, s.y + 10, P); }
    if (p.chest) {
      const c = p.chest;
      ellipse(g, c.x + c.w / 2, c.y + c.h + 4, c.w * 0.55, 14); g.fillStyle = 'rgba(15,5,25,0.35)'; g.fill();
      rrect(g, c.x, c.y, c.w, c.h, 10); g.fillStyle = lg(g, 0, c.y, 0, c.y + c.h, [[0, P.wood], [1, P.woodD]]); g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
      g.fillStyle = P.metal; g.fillRect(c.x + 16, c.y, 12, c.h); g.fillRect(c.x + c.w - 28, c.y, 12, c.h);
      rrect(g, c.x + c.w / 2 - 14, c.y + 28, 28, 30, 6); g.fill(); g.stroke();
    }
  },
  cauldron(g, p, R, P) {
    BACK.wallshelf(g, p, R, P);
    const { x, y, r } = p.pot;
    g.fillStyle = rg(g, x, y - r * 0.7, r * 0.2, r * 2.2, [[0, 'rgba(125,255,154,0.35)'], [1, 'rgba(125,255,154,0)']]); g.fillRect(x - r * 2.2, y - r * 2.6, r * 4.4, r * 3.2);
    // fire
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * r * 0.25 - 14, y - 6); g.quadraticCurveTo(x + k * r * 0.25, y - 50 - rnd() * 20, x + k * r * 0.25 + 14, y - 6); g.fillStyle = k % 2 ? '#ffb030' : '#ff6a30'; g.fill(); }
    ellipse(g, x, y - r * 0.75, r, r * 0.8); g.fillStyle = lg(g, 0, y - r * 1.5, 0, y, [[0, '#4a4a60'], [1, '#22222e']]); g.fill(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke();
    ellipse(g, x, y - r * 1.38, r * 0.92, r * 0.2); g.fillStyle = '#7dff9a'; g.fill(); g.stroke();
    for (let k = 0; k < 5; k++) { circle(g, x + (rnd() - 0.5) * r * 1.4, y - r * 1.42 - rnd() * 18, 5 + rnd() * 8); g.fillStyle = 'rgba(200,255,210,0.8)'; g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.18)'; ellipse(g, x - r * 0.45, y - r * 0.9, r * 0.14, r * 0.3, 0.4); g.fill();
  },
  window(g, p, R, P) {
    const { win, dresser: d } = p;
    g.save();
    if (win.round) { circle(g, win.x + win.w / 2, win.y + win.h / 2, Math.min(win.w, win.h) / 2); }
    else rrect(g, win.x, win.y, win.w, win.h, 16);
    g.fillStyle = P.woodD; g.fill(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke();
    if (win.round) circle(g, win.x + win.w / 2, win.y + win.h / 2, Math.min(win.w, win.h) / 2 - 12); else rrect(g, win.x + 12, win.y + 12, win.w - 24, win.h - 24, 8);
    g.clip(); nightSky(g, win.x, win.y, win.w, win.h);
    g.strokeStyle = P.woodD; g.lineWidth = 10; g.beginPath(); g.moveTo(win.x + win.w / 2, win.y); g.lineTo(win.x + win.w / 2, win.y + win.h); g.moveTo(win.x, win.y + win.h / 2); g.lineTo(win.x + win.w, win.y + win.h / 2); g.stroke();
    g.restore();
    // moonlight on the wall
    g.save(); g.globalAlpha = 0.08; g.fillStyle = '#fff4c8';
    g.beginPath(); g.moveTo(win.x, win.y + win.h); g.lineTo(win.x + win.w, win.y + win.h); g.lineTo(win.x + win.w + 80, R.h); g.lineTo(win.x - 60, R.h); g.closePath(); g.fill(); g.restore();
    // curtains
    if (!win.round) for (const side of [-1, 1]) {
      const cx = side < 0 ? win.x - 6 : win.x + win.w + 6;
      g.beginPath(); g.moveTo(cx, win.y - 16); g.lineTo(cx - side * 44, win.y - 16);
      g.quadraticCurveTo(cx - side * 10, win.y + win.h * 0.5, cx - side * 30, win.y + win.h + 10); g.lineTo(cx + side * 10, win.y + win.h + 10); g.closePath();
      g.fillStyle = P.cloth; g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    }
    // dresser
    ellipse(g, d.x + d.w / 2, d.y + d.h + 4, d.w * 0.55, 14); g.fillStyle = 'rgba(15,5,25,0.35)'; g.fill();
    rrect(g, d.x, d.y, d.w, d.h, 8); g.fillStyle = lg(g, 0, d.y, 0, d.y + d.h, [[0, P.wood], [1, P.woodD]]); g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    for (let k = 0; k < 2; k++) {
      rrect(g, d.x + 14, d.y + 26 + k * 66, d.w - 28, 54, 6); g.fillStyle = shade(P.wood, -0.08); g.fill(); g.lineWidth = 3; g.stroke();
      circle(g, d.x + d.w / 2, d.y + 53 + k * 66, 7); g.fillStyle = P.metal; g.fill(); g.stroke();
    }
  },
  pegs(g, p, R, P) {
    posts(g, R, P, [p.x + 10, p.x + p.w - 26], p.rail.y);
    board(g, p.x + 4, p.rail.y - 14, p.w - 8, 22, P, 6);
    for (const x of p.pegs) { circle(g, x, p.rail.y + 6, 7); g.fillStyle = P.metal; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke(); }
    if (p.shelf) { shadowUnder(g, p.shelf.a, p.shelf.y + 12, p.shelf.b - p.shelf.a, 0.25); bracket(g, p.shelf.a + 20, p.shelf.y + 10, P); bracket(g, p.shelf.b - 20, p.shelf.y + 10, P); }
    const t = p.table, legH = R.floorY + 22 - t.y;
    ellipse(g, t.x + t.w / 2, R.floorY + 24, t.w * 0.5, 12); g.fillStyle = 'rgba(15,5,25,0.3)'; g.fill();
    for (const lx of [t.x + 18, t.x + t.w - 34]) { rrect(g, lx, t.y + 10, 16, legH - 10, 5); g.fillStyle = P.woodD; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke(); }
    rrect(g, t.x + 8, t.y + 14, t.w - 16, 22, 4); g.fillStyle = P.woodD; g.fill(); g.stroke();
  },
  stove(g, p, R, P) {
    const s = p.stove, hd = p.hood, cx = s.x + s.w / 2;
    // hood + pipe
    g.fillStyle = '#5a5070'; g.fillRect(cx - 18, 0, 36, hd.y + 10); g.strokeStyle = OUT; g.lineWidth = 3; g.strokeRect(cx - 18, -4, 36, hd.y + 14);
    g.beginPath(); g.moveTo(cx - s.w * 0.22, hd.y); g.lineTo(cx + s.w * 0.22, hd.y); g.lineTo(cx + s.w * 0.48, hd.y + hd.h); g.lineTo(cx - s.w * 0.48, hd.y + hd.h); g.closePath();
    g.fillStyle = lg(g, 0, hd.y, 0, hd.y + hd.h, [[0, '#8a80a8'], [1, '#5a5070']]); g.fill(); g.lineWidth = 4; g.stroke();
    if (p.shelf) { shadowUnder(g, p.shelf.a, p.shelf.y + 12, p.shelf.b - p.shelf.a, 0.25); bracket(g, p.shelf.a + 22, p.shelf.y + 10, P); bracket(g, p.shelf.b - 22, p.shelf.y + 10, P); }
    // body
    const bh = R.floorY + 18 - s.y;
    rrect(g, s.x, s.y, s.w, bh, 10); g.fillStyle = lg(g, 0, s.y, 0, s.y + bh, [[0, '#4a4060'], [1, '#2a2438']]); g.fill(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke();
    rrect(g, s.x + s.w * 0.18, s.y + 44, s.w * 0.64, bh - 70, 12); g.fillStyle = '#1a1424'; g.fill(); g.lineWidth = 3; g.stroke();
    rrect(g, s.x + s.w * 0.26, s.y + 58, s.w * 0.48, bh - 100, 10); g.fillStyle = rg(g, cx, s.y + bh * 0.55, 4, s.w * 0.4, [[0, '#ffd060'], [1, '#c04a20']]); g.fill(); g.stroke();
    for (const kx of [0.2, 0.4, 0.6, 0.8]) { circle(g, s.x + s.w * kx, s.y + 24, 7); g.fillStyle = '#c9c2d6'; g.fill(); g.lineWidth = 2; g.stroke(); }
  },
  bed(g, p, R, P) {
    const b = p.bed, hb = b.y - 150;
    if (p.shelf) { shadowUnder(g, p.shelf.a, p.shelf.y + 12, p.shelf.b - p.shelf.a, 0.25); bracket(g, p.shelf.a + 22, p.shelf.y + 10, P); bracket(g, p.shelf.b - 22, p.shelf.y + 10, P); }
    g.beginPath(); g.moveTo(b.x + 6, b.y + 20); g.lineTo(b.x + 6, hb + 40); g.quadraticCurveTo(b.x + 6, hb, b.x + 70, hb); g.lineTo(b.x + b.w * 0.45, hb); g.quadraticCurveTo(b.x + b.w * 0.6, hb - 20, b.x + b.w * 0.7, hb + 30); g.lineTo(b.x + b.w * 0.7, b.y + 20); g.closePath();
    g.fillStyle = lg(g, 0, hb, 0, b.y, [[0, P.wood], [1, P.woodD]]); g.fill(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke();
    circle(g, b.x + b.w * 0.36, hb + 46, 18); g.fillStyle = P.metal; g.fill(); g.lineWidth = 3; g.stroke();
    rrect(g, b.x + 22, b.y - 40, b.w * 0.34, 46, 20); g.fillStyle = '#fff6ee'; g.fill(); g.stroke();
    const bh = R.floorY + 20 - b.y;
    rrect(g, b.x, b.y, b.w, bh, 14); g.fillStyle = lg(g, 0, b.y, 0, b.y + bh, [[0, P.cloth], [1, shade(P.cloth, -0.3)]]); g.fill(); g.lineWidth = 5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.25)'; for (let x = b.x + 20; x < b.x + b.w - 10; x += 36) { star(g, x, b.y + bh * 0.6, 7); g.fill(); }
  },
  bench(g, p, R, P) {
    const b = p.bench;
    posts(g, R, P, [p.x + 14, p.x + p.w - 30], p.rail.y);
    board(g, p.x + 10, p.rail.y - 12, p.w - 20, 20, P, 6);
    for (const x of p.pegs) { circle(g, x, p.rail.y + 6, 7); g.fillStyle = P.metal; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke(); }
    ellipse(g, b.x + b.w / 2, R.floorY + 22, b.w * 0.5, 12); g.fillStyle = 'rgba(15,5,25,0.3)'; g.fill();
    for (const lx of [b.x + 12, b.x + b.w - 28]) { rrect(g, lx, b.y, 16, R.floorY + 20 - b.y, 5); g.fillStyle = P.woodD; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke(); }
    // flower pots on the low shelf
    for (let x = b.x + 34; x < b.x + b.w - 50; x += 64) {
      g.beginPath(); g.moveTo(x, b.low - 40); g.lineTo(x + 40, b.low - 40); g.lineTo(x + 34, b.low); g.lineTo(x + 6, b.low); g.closePath(); g.fillStyle = '#c8643a'; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
      for (let k = 0; k < 3; k++) { circle(g, x + 10 + k * 10, b.low - 50 - (k % 2) * 10, 9); g.fillStyle = k % 2 ? '#ff8ac8' : '#6ac87a'; g.fill(); g.lineWidth = 2; g.stroke(); }
    }
  },
  stump(g, p, R, P) {
    const s = p.stump, l = p.lantern;
    g.strokeStyle = '#2a2018'; g.lineWidth = 4; g.beginPath(); g.moveTo(l.x, 0); g.lineTo(l.x, l.y - 30); g.stroke();
    g.fillStyle = rg(g, l.x, l.y, 6, 120, [[0, 'rgba(255,220,120,0.4)'], [1, 'rgba(255,220,120,0)']]); g.fillRect(l.x - 120, l.y - 120, 240, 240);
    rrect(g, l.x - 22, l.y - 30, 44, 56, 10); g.fillStyle = 'rgba(255,230,140,0.9)'; g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    g.fillStyle = '#2a2018'; g.fillRect(l.x - 26, l.y - 36, 52, 10); g.fillRect(l.x - 26, l.y + 22, 52, 10);
    const bot = R.floorY + 26;
    ellipse(g, s.x, bot, s.r * 1.15, 16); g.fillStyle = 'rgba(15,5,25,0.35)'; g.fill();
    g.beginPath(); g.moveTo(s.x - s.r, s.y); g.lineTo(s.x - s.r * 1.12, bot); g.lineTo(s.x + s.r * 1.12, bot); g.lineTo(s.x + s.r, s.y); g.closePath();
    g.fillStyle = lg(g, s.x - s.r, 0, s.x + s.r, 0, [[0, '#4a3020'], [0.5, '#7a5034'], [1, '#4a3020']]); g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    ellipse(g, s.x, s.y, s.r, s.r * 0.24); g.fillStyle = '#c89a68'; g.fill(); g.stroke();
    for (let k = 1; k < 4; k++) { ellipse(g, s.x, s.y, s.r * k / 4, s.r * 0.24 * k / 4); g.strokeStyle = 'rgba(90,50,30,0.5)'; g.lineWidth = 2; g.stroke(); }
  },
};

// ---------- furniture: in front of the items ----------
const FRONT = {
  bookcase(g, p, R, P) { for (const y of p.shelves) board(g, p.x + 6, y - 4, p.w - 12, 16, P, 4); board(g, p.x - 8, p.top - 18, p.w + 16, 10, P, 4); },
  wallshelf(g, p, R, P) {
    if (p.shelves.length) posts(g, R, P, [p.shelves[0].a + 4, p.shelves[0].b - 20], p.shelves[0].y);
    for (const s of p.shelves) board(g, s.a, s.y - 4, s.b - s.a, 16, P, 4);
    if (p.chest) board(g, p.chest.x - 6, p.chest.y - 6, p.chest.w + 12, 16, P, 6);
  },
  cauldron(g, p, R, P) { for (const s of p.shelves) board(g, s.a, s.y - 4, s.b - s.a, 16, P, 4); },
  window(g, p, R, P) {
    board(g, p.win.x - 22, p.win.y + p.win.h + 2, p.win.w + 44, 16, P, 5);
    board(g, p.dresser.x - 8, p.dresser.y - 6, p.dresser.w + 16, 18, P, 6);
  },
  pegs(g, p, R, P) {
    if (p.shelf) board(g, p.shelf.a, p.shelf.y - 4, p.shelf.b - p.shelf.a, 16, P, 4);
    const t = p.table;
    if (R.theme === 'kitchen' || R.theme === 'bedroom') {
      board(g, t.x, t.y - 6, t.w, 18, P, 6);
      g.beginPath(); g.moveTo(t.x - 4, t.y + 6); g.lineTo(t.x + t.w + 4, t.y + 6); g.lineTo(t.x + t.w - 2, t.y + 40);
      for (let x = t.x + t.w - 2; x > t.x; x -= 20) g.quadraticCurveTo(x - 10, t.y + 48, x - 20, t.y + 40);
      g.closePath(); g.fillStyle = P.cloth2; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
    } else board(g, t.x, t.y - 6, t.w, 20, P, 6);
  },
  stove(g, p, R, P) {
    const s = p.stove;
    rrect(g, s.x - 8, s.y - 6, s.w + 16, 18, 6); g.fillStyle = lg(g, 0, s.y - 6, 0, s.y + 12, [[0, '#8a80a8'], [1, '#5a5070']]); g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    if (p.shelf) board(g, p.shelf.a, p.shelf.y - 4, p.shelf.b - p.shelf.a, 16, P, 4);
  },
  bed(g, p, R, P) {
    const b = p.bed;
    if (p.shelf) board(g, p.shelf.a, p.shelf.y - 4, p.shelf.b - p.shelf.a, 16, P, 4);
    rrect(g, b.x - 4, b.y - 2, b.w + 8, 24, 12); g.fillStyle = shade(P.cloth, 0.2); g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(b.x + 10, b.y + 3, b.w - 20, 4);
  },
  bench(g, p, R, P) { board(g, p.bench.x - 6, p.bench.y - 6, p.bench.w + 12, 18, P, 5); board(g, p.bench.x + 4, p.bench.low - 4, p.bench.w - 8, 14, P, 4); },
  stump() {},
};

// ---------- foreground dressing ----------
const FG = {
  cobweb(g, R) {
    for (const [cx, sx] of [[0, 1], [R.w, -1]]) {
      g.save(); g.strokeStyle = 'rgba(240,235,255,0.35)'; g.lineWidth = 2;
      const r = Math.min(150, R.w * 0.14);
      for (let k = 0; k <= 5; k++) { const a = k / 5 * Math.PI / 2; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx + sx * Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
      for (let rr = r * 0.3; rr <= r; rr += r * 0.23) { g.beginPath(); for (let k = 0; k <= 5; k++) { const a = k / 5 * Math.PI / 2, q = rr * (k % 2 ? 0.92 : 1); const x = cx + sx * Math.cos(a) * q, y = Math.sin(a) * q; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.restore();
    }
  },
  lights(g, R, P) {
    g.strokeStyle = 'rgba(40,20,50,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 14);
    const seg = 160;
    for (let x = 0; x < R.w; x += seg) g.quadraticCurveTo(x + seg / 2, 54, x + seg, 14);
    g.stroke();
    const cols = ['#ffe66d', '#ff8ac8', '#7fe0ff', '#9dff8a'];
    for (let x = 20, k = 0; x < R.w; x += 40, k++) {
      const t = (x % seg) / seg, y = 14 + 4 * 40 * t * (1 - t) - 2;
      g.fillStyle = rg(g, x, y + 10, 1, 18, [[0, cols[k % 4]], [1, 'rgba(255,255,255,0)']]); g.fillRect(x - 18, y - 8, 36, 36);
      ellipse(g, x, y + 10, 6, 8); g.fillStyle = cols[k % 4]; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    }
  },
  grass(g, R) {
    for (let x = -10; x < R.w + 10; x += 9) {
      const hh = 18 + rnd() * 34, lean = (rnd() - 0.5) * 18;
      g.beginPath(); g.moveTo(x - 6, R.h + 2); g.quadraticCurveTo(x + lean * 0.4, R.h - hh * 0.6, x + lean, R.h - hh); g.quadraticCurveTo(x + lean * 0.3 + 3, R.h - hh * 0.5, x + 6, R.h + 2); g.closePath();
      g.fillStyle = rnd() < 0.5 ? '#3a8a4a' : '#4aa05a'; g.fill();
    }
    for (let k = 0; k < R.w / 70; k++) { const x = rnd() * R.w, y = R.h - 30 - rnd() * 20; circle(g, x, y, 6); g.fillStyle = ['#ff8ac8', '#fff36b', '#ffffff'][k % 3]; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); }
    for (let k = 0; k < 14; k++) sparkle(g, rnd() * R.w, rnd() * R.floorY, 3 + rnd() * 3, '#e8ff9a');
  },
  vines(g, R) {
    for (const x0 of [R.w * 0.04, R.w * 0.96]) {
      g.strokeStyle = '#2e6a3a'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0, 0);
      const len = R.floorY * 0.45;
      for (let y = 0; y < len; y += 40) g.quadraticCurveTo(x0 + (y / 40 % 2 ? 18 : -18), y + 20, x0, y + 40);
      g.stroke();
      for (let y = 30; y < len; y += 36) { ellipse(g, x0 + (y / 36 % 2 ? 12 : -12), y, 12, 7, y / 36 % 2 ? 0.6 : -0.6); g.fillStyle = '#4aa05a'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); }
    }
  },
};
