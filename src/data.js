// Catalog of findable things, room themes, and the seeded scene generator.
import { OBJECT_NAMES } from './objects.js';
import { composeRoom } from './rooms.js';
export const MAX_TIER = 8;

const MAGIC = {
  potion: ['Dewdrop', 'Tiny Vial', 'Bubble Tonic', 'Fizzy Elixir', 'Love Potion', 'Rainbow Brew', 'Phoenix Draught', 'Starlight Flask'],
  herb: ['Sprout', 'Leaf', 'Lucky Clover', 'Fern', 'Lavender', 'Moonflower', 'Sunbloom', 'Golden Lotus'],
  mush: ['Spore', 'Button Cap', 'Toadstool', 'Puffball', 'Glow Cap', 'Twin Shrooms', 'Fairy Ring', 'Elder Shroom'],
  crys: ['Pebble', 'Shard', 'Crystal', 'Amethyst', 'Prism', 'Star Gem', 'Moonstone', 'Dragon Heart'],
};
// Every findable kind: {kind:'obj', obj} or {kind:'item', chain, tier}
export const CATALOG = [];
for (const k of Object.keys(OBJECT_NAMES)) if (k !== 'mouse') CATALOG.push({ kind: 'obj', obj: k, name: OBJECT_NAMES[k] });
for (const [chain, names] of Object.entries(MAGIC)) names.forEach((n, i) => { if (i > 0) CATALOG.push({ kind: 'item', chain, tier: i + 1, name: n }); });
export const MOUSE = -1;

export const THEMES = [
  { id: 'attic', name: 'The Dusty Attic' },
  { id: 'kitchen', name: 'Cozy Kitchen' },
  { id: 'garden', name: 'Moonlit Garden' },
  { id: 'library', name: 'Wizard Library' },
  { id: 'lab', name: 'Potion Lab' },
  { id: 'bedroom', name: 'Sleepy Bedroom' },
];

// Default scene size (portrait); the game passes the real size for the current screen at level start.
export const SW = 700, SH = 880;
// The zoom button sits over the scene's top-right corner; keep targets + mouse out from under it.
const ZOOM_R = 40;
const underZoomButton = (w, x, y, size) => Math.hypot(x - (w - 46), y - 46) < ZOOM_R + size * 0.35;

let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function levelParams(L) {
  const targets = Math.min(12, 6 + Math.floor((L - 1) / 3));
  const size = Math.max(60, 96 - L * 1.8);           // items shrink as levels go on
  const gap = Math.max(0.56, 0.8 - L * 0.014);       // and crowd closer together (more overlap)
  const mode = L <= 3 ? 'picture' : L % 4 === 0 ? 'shadow' : 'words';
  const time = Math.round((50 + targets * 11 + Math.min(30, L)) / 5) * 5;
  return { targets, size, gap, mode, time };
}

export function generateScene(L, w = SW, h = SH) {
  w = Math.round(w); h = Math.round(h);
  const p = levelParams(L);
  const theme = THEMES[(L - 1) % THEMES.length];
  const room = composeRoom(theme.id, w, h, Math.floor((L - 1) / THEMES.length) % 3);
  seed = 4211 + L * 7919;
  // word lists only use everyday objects (a fancy potion name gives no clue what to look for)
  const all = shuffle(CATALOG.map((_, i) => i));
  const named = all.filter(i => CATALOG[i].kind === 'obj');
  const targetTypes = (p.mode === 'words' ? named : all).slice(0, p.targets);
  const filler = all.filter(i => !targetTypes.includes(i)).slice(0, Math.min(CATALOG.length - p.targets, 18 + L));
  const items = [];
  let id = 0;
  const add = (x, y, size, rot, z, sit) => {
    const m = size * 0.4;
    items.push({ id: id++, t: filler[Math.floor(rnd() * filler.length)], x: Math.min(w - m, Math.max(m, x)), y: Math.max(m, y), size, rot, flip: rnd() < 0.5, z, sit });
  };
  // items sit on shelves, tables, sills and the floor, packed side by side with some overlap
  for (const s of room.surfaces) {
    if (s.y < p.size * 1.15) continue; // top of a tall bookcase: items would poke out of the frame
    // shelves get a back row too: raised a little and partly hidden behind the front row
    if (!s.floor) {
      let x = s.x0 + p.size * 0.25 + rnd() * 14;
      for (;;) {
        const size = p.size * s.s * (0.72 + rnd() * 0.3);
        if (x + size * 0.84 > s.x1) break;
        add(x + size * 0.42, s.y - size * 0.37 - p.size * 0.2, size, (rnd() - 0.5) * 0.25, s.y - 40 + rnd() * 10, true);
        items[items.length - 1].back = true;
        x += size * p.gap * (0.85 + rnd() * 0.4) * 1.1;
      }
    }
    let x = s.x0 + rnd() * 12;
    for (;;) {
      const size = p.size * s.s * (0.8 + rnd() * 0.38);
      if (x + size * 0.84 > s.x1) break;
      const lean = rnd() < 0.12 ? (rnd() - 0.5) * 1.1 : (rnd() - 0.5) * 0.3;
      add(x + size * 0.42, s.y - size * 0.37, size, lean, s.y + rnd() * 30, true);
      x += size * p.gap * (0.8 + rnd() * 0.4);
    }
  }
  for (const hk of room.hangs) {
    const size = p.size * (0.85 + rnd() * 0.25);
    add(hk.x, hk.y + size * 0.44, size, (rnd() - 0.5) * 0.3, hk.y + rnd() * 10, false);
  }
  // targets: spread out, not under the zoom button
  const cell = Math.sqrt(w * h / p.targets) * 0.55;
  const cand = shuffle(items.slice()).filter(it => !underZoomButton(w, it.x, it.y, it.size));
  const picks = [];
  for (const it of cand) {
    if (picks.length >= targetTypes.length) break;
    if (picks.every(o => Math.hypot(o.x - it.x, o.y - it.y) > cell)) picks.push(it);
  }
  for (const it of cand) { if (picks.length >= targetTypes.length) break; if (!picks.includes(it)) picks.push(it); }
  picks.forEach((it, k) => { it.t = targetTypes[k]; it.target = true; });
  // golden mouse: peeking out from behind an item on a shelf or the floor
  const hosts = shuffle(items.filter(it => !it.target && it.sit));
  const tgs = items.filter(it => it.target);
  const ms = p.size * 0.6;
  const mouse = { id: id++, t: MOUSE, x: 0, y: 0, size: ms, rot: (rnd() - 0.5) * 0.3, flip: rnd() < 0.5, z: 0, gold: true, sit: true };
  for (const host of hosts) {
    const side = rnd() < 0.5 ? -1 : 1;
    mouse.x = Math.min(w - 30, Math.max(30, host.x + side * host.size * 0.42));
    mouse.y = host.y + host.size * 0.37 - ms * 0.37;
    mouse.z = host.z - 0.5;
    if (!underZoomButton(w, mouse.x, mouse.y, ms) && tgs.every(t => Math.hypot(t.x - mouse.x, t.y - mouse.y) > (t.size + ms) * 0.45)) break;
  }
  items.push(mouse);
  // a target may be partly covered, but its middle stays visible: anything over its centre goes behind it
  for (const t of items.filter(it => it.target || it.gold)) {
    for (const o of items) {
      if (o === t || o.target || o.gold) continue;
      if (o.z > t.z && Math.hypot(o.x - t.x, o.y - t.y) < (o.size * 0.38 + t.size * 0.2)) o.z = t.z - 0.01 - rnd() * 0.1;
    }
  }
  items.sort((a, b) => a.z - b.z);
  return { ...p, theme, room, sw: w, sh: h, items, targets: picks.map(it => it.id) };
}
