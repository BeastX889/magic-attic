// Rules + state for Magic Attic: Hidden Objects. Emits events, never draws.
import { generateScene } from './data.js';

const KEY = 'lumio-hidden-attic-v1';
export const BOOST_COST = 60, TIME_COST = 80, TIME_ADD = 30, FREEZE_TIME = 15, MISS_PENALTY = 3;
export let P = null;   // profile (saved)
let store = typeof localStorage !== 'undefined' ? localStorage : null;
export const setStore = s => { if (s) store = s; };   // portal.store: CrazyGames Data module or localStorage
export let G = null;   // current level
const subs = [];
export const on = f => subs.push(f);
const emit = (type, d = {}) => { for (const f of subs) f(type, d); };

const fresh = () => ({ v: 1, level: 1, coins: 0, boost: { hint: 3, freeze: 2, time: 2 }, muted: false, stars: {}, mice: [] });
export function loadProfile() {
  try {
    const d = JSON.parse(store.getItem(KEY) || 'null');
    if (d && d.v === 1) {   // merge over defaults so a damaged save can't crash the game
      const f = fresh();
      P = { ...f, ...d, boost: { ...f.boost, ...(d.boost && typeof d.boost === 'object' ? d.boost : {}) } };
      P.level = Math.floor(Number(P.level));
      if (!(P.level >= 1 && P.level <= 1e5)) P.level = 1;
      if (typeof P.coins !== 'number' || !isFinite(P.coins) || P.coins < 0) P.coins = 0;
      for (const k of Object.keys(f.boost)) { const n = Math.floor(Number(P.boost[k])); P.boost[k] = n >= 0 && n < 1e6 ? n : f.boost[k]; }
      P.muted = P.muted === true;
      if (!P.stars || typeof P.stars !== 'object') P.stars = {};
      if (!Array.isArray(P.mice)) P.mice = [];
      return;
    }
  } catch (e) {}
  P = fresh();
}
export function saveProfile() { try { store.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
if (new URLSearchParams(location.search).has('reset')) { try { store.removeItem(KEY); } catch (e) {} }

// Scene size for new levels, in scene units: set by the renderer to fit the current screen.
let dims = { w: 700, h: 880 };
export const setDims = d => { dims = { w: Math.round(d.w), h: Math.round(d.h) }; };
export function startLevel(L = P.level) {
  const sc = generateScene(L, dims.w, dims.h);
  G = {
    level: L, ...sc, timeLeft: sc.time, started: false, found: new Set(), combo: 0, lastFind: -99,
    freeze: 0, misses: 0, coinsEarned: 0, mouseFound: false, state: 'play', taps: 0,
  };
  G.byId = new Map(sc.items.map(it => [it.id, it]));
  emit('start', { level: L });
}

export const remaining = () => G.targets.filter(id => !G.found.has(id));

// Is (x, y) inside item `it` (in its own rotated frame)? minR: smallest half-width of the tap box (small items on phones).
function hits(it, x, y, pad = 1, minR = 0) {
  const dx = x - it.x, dy = y - it.y, c = Math.cos(-it.rot), s = Math.sin(-it.rot);
  const lx = dx * c - dy * s, ly = dx * s + dy * c, r = Math.max(it.size * 0.42 * pad, minR);
  return Math.abs(lx) < r && Math.abs(ly) < r;
}

// A tap at scene coords. minR (scene units) widens the tap box of small items to a finger-sized minimum.
// Returns what happened.
export function tap(x, y, pad = 1, minR = 0) {
  if (G.state !== 'play') return null;
  G.started = true; G.taps++;
  const mouse = G.items.find(it => it.gold);
  const open = it => it.gold ? !G.mouseFound : it.target && !G.found.has(it.id);
  // a tap right on an item: the top-most one under the finger (the mouse peeks out, so it wins ties)
  let best = mouse && open(mouse) && hits(mouse, x, y, pad * 1.1) ? mouse : null;
  for (let k = G.items.length - 1; k >= 0 && !best; k--) {
    const it = G.items[k];
    if (it.target && open(it) && hits(it, x, y, pad)) best = it;
  }
  // near miss on a small item: the closest one whose finger-sized box holds the tap
  if (!best && minR > 0) {
    let bd = Infinity;
    for (const it of G.items) {
      if (!(it.target || it.gold) || !open(it) || !hits(it, x, y, pad, minR)) continue;
      const d = Math.hypot(it.x - x, it.y - y);
      if (d < bd) { bd = d; best = it; }
    }
  }
  if (best && best.gold) {
    G.mouseFound = true;
    if (!P.mice.includes(G.level)) { P.mice.push(G.level); G.mouseNew = true; }
    G.coinsEarned += 15;
    emit('mouse', { it: mouse, coins: 15 });
    return 'mouse';
  }
  if (!best) {
    G.misses++;
    G.timeLeft = Math.max(0, G.timeLeft - MISS_PENALTY);
    emit('miss', { x, y, penalty: MISS_PENALTY });
    if (G.timeLeft <= 0) { G.state = 'lose'; emit('lose'); }
    return 'miss';
  }
  G.found.add(best.id);
  const now = performance.now() / 1000;
  G.combo = now - G.lastFind < 4 ? G.combo + 1 : 1;
  G.lastFind = now;
  const coins = 1 + Math.min(G.combo, 5);
  G.coinsEarned += coins;
  emit('find', { it: best, combo: G.combo, coins, index: G.targets.indexOf(best.id) });
  if (G.found.size >= G.targets.length) win();
  return 'find';
}

function win() {
  G.state = 'win';
  const r = G.timeLeft / G.time;
  const stars = r >= 0.5 ? 3 : r >= 0.25 ? 2 : 1;
  const coins = 10 + stars * 5 + G.coinsEarned;
  P.coins += coins;
  P.stars[G.level] = Math.max(P.stars[G.level] || 0, stars);
  if (G.level >= P.level) P.level = G.level + 1;
  saveProfile();
  emit('win', { stars, coins, bonus: coins - G.coinsEarned, level: G.level, mouse: G.mouseFound, mouseMilestone: !!G.mouseNew && P.mice.length % 5 === 0 });
  G.coinsEarned = 0;
}

export function tick(dt) {
  if (G.state !== 'play' || !G.started) return;
  if (G.freeze > 0) { G.freeze = Math.max(0, G.freeze - dt); return; }
  const before = Math.ceil(G.timeLeft);
  G.timeLeft = Math.max(0, G.timeLeft - dt);
  if (Math.ceil(G.timeLeft) !== before && G.timeLeft <= 10) emit('tick', { left: Math.ceil(G.timeLeft) });
  if (G.timeLeft <= 0) { G.state = 'lose'; emit('lose'); }
}

export function useBoost(kind) {
  if (P.boost[kind] <= 0 || G.state !== 'play') return false;
  if (kind === 'hint') {
    const left = remaining();
    if (!left.length) return false;
    // hint the one that's hardest to spot: the smallest remaining
    const id = left.map(i => G.byId.get(i)).sort((a, b) => a.size - b.size)[0].id;
    emit('hint', { it: G.byId.get(id) });
  } else if (kind === 'freeze') {
    G.freeze = FREEZE_TIME; G.started = true;
    emit('freeze', { secs: FREEZE_TIME });
  } else if (kind === 'time') {
    G.timeLeft += TIME_ADD;
    emit('time', { add: TIME_ADD });
  }
  P.boost[kind]--;
  saveProfile();
  return true;
}
export function grantBoost(kind, n) { P.boost[kind] += n; saveProfile(); emit('boostGain', { kind, n }); }
export function buyBoost(kind) {
  const cost = kind === 'time' ? TIME_COST : BOOST_COST;
  if (P.coins < cost) return false;
  P.coins -= cost; grantBoost(kind, 1); return true;
}
export function reviveTime() { G.timeLeft += TIME_ADD; G.state = 'play'; emit('time', { add: TIME_ADD }); }
