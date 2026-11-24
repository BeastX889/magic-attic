// Magic Attic: Hidden Objects: rendering, camera, input, HUD, popups.
import { CATALOG, MOUSE } from './data.js';
import {
  P, G, on, loadProfile, saveProfile, setStore, setDims, startLevel, tap, tick, remaining, useBoost, grantBoost, buyBoost,
  reviveTime, BOOST_COST, TIME_COST, TIME_ADD, FREEZE_TIME,
} from './game.js';
import { itemSprite, coinIcon, starIcon, rrect, sprite, clearArtCache, lg, rg, circle, sparkle, shade, OUT } from './art.js';
const oval = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); };
import { drawObject } from './objects.js';
import { roomCanvas } from './rooms.js';
import { E, FONT, text, burst, ring, floatText, fly, updateFx, drawParticles, drawFlyers, shake, addShake, clearFx } from './fx.js';
import { unlockAudio, setMuted, duck, suspendAudio, sfx } from './audio.js';
import { portal } from './portal.js';

const W = 720;
// Portrait: top bar, room, item list, boosters; the stage grows taller on tall phones so the room fills the screen.
// Landscape (desktop): top bar, big room on the left, list + boosters in a panel on the right.
let land = false, StW = W, StH = 1280;
const LY = { box: { x: 10, y: 112, w: 700, h: 856 }, panel: null, tray: null };
let SB = { x: 10, y: 112, w: 700, h: 856, k: 1 };   // the level's scene fitted into LY.box (stage units)
const sceneDims = () => ({ w: land ? LY.box.w : 700, h: LY.box.h });
function fitScene() {   // a level started in the other orientation is letterboxed until the next level
  const b = LY.box, k = Math.min(b.w / G.sw, b.h / G.sh);
  SB = { x: b.x + (b.w - G.sw * k) / 2, y: b.y + (b.h - G.sh * k) / 2, w: G.sw * k, h: G.sh * k, k };
}
const cv = document.getElementById('game');
const g = cv.getContext('2d');
const view = { sc: 1, res: 1, ox: 0, oy: 0, vx: 0, vy: 0, vw: W, vh: 1280 };
const px = v => Math.max(4, Math.ceil(v * view.res));
let dpr = 1, paused = false;
let popup = null, banner = null, hint = null, idleT = 0, quietFx = false;
const nowS = () => performance.now() / 1000;
const bump = { coins: 0, timer: 0 };
let dispCoins = 0, holdCoins = 0;
const cardBump = new Map();    // target index -> t0
const marks = [];              // miss crosses {x, y, t0} in scene coords
const MAXZ = 3;
const cam = { z: 1, x: 0, y: 0 }, camT = { z: 1, x: 0, y: 0 };
let lastFindT = 0, tabHidden = false, loseCount = 0;
let adBroken = false;   // an ad failed this session (e.g. CrazyGames Basic Launch serves none): stop offering ads
const adOffer = () => portal.adsOk && !adBroken;
// Popups are laid out around (360, 640) and drawn centred + fit-scaled on the current stage; this maps a popup point to the stage.
const popupK = () => Math.min(1.25, (StH - 90) / 680, (StW - 40) / 520);   // popups span y 300..960 of their layout
const popPt = (x, y) => ({ x: StW / 2 + (x - 360) * popupK(), y: StH / 2 + (y - 640) * popupK() });
// The game's sound is off when the player muted it or the portal asks for silence (CrazyGames muteAudio setting).
const isMuted = () => P.muted || portal.muted;
const applyMute = () => setMuted(isMuted());

function resize() {
  const oldRes = view.res;
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const cw = Math.max(1, window.innerWidth), ch = Math.max(1, window.innerHeight);
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  land = cw > ch * 1.05;
  if (land) {
    StH = ch < 480 ? 760 : 900;   // phones held sideways: a shorter stage draws everything bigger
    StW = Math.max(1400, Math.min(1760, Math.round(StH * cw / ch)));
    const pw = 340;
    LY.box = { x: 14, y: 82, w: StW - pw - 42, h: StH - 96 };
    LY.panel = { x: StW - pw - 14, y: 82, w: pw, h: StH - 96 }; LY.tray = null;
  } else {
    StW = W; StH = Math.max(1180, Math.min(1560, Math.round(W * ch / cw)));
    LY.box = { x: 10, y: 112, w: 700, h: StH - 448 };
    LY.tray = { x: 10, y: StH - 326, w: 700, h: 196 }; LY.panel = null;
  }
  setDims(sceneDims());
  if (G) fitScene();
  const sc = Math.min(cw / StW, ch / StH);
  Object.assign(view, { sc, res: sc * dpr, ox: (cw - StW * sc) / 2, oy: (ch - StH * sc) / 2 });
  view.vx = -view.ox / sc; view.vy = -view.oy / sc; view.vw = cw / sc; view.vh = ch / sc;
  if (view.res !== oldRes) clearArtCache();
}
window.addEventListener('resize', resize);

// ---------- camera ----------
function clampCam(c) {
  c.z = Math.max(1, Math.min(MAXZ, c.z));
  c.x = Math.max(0, Math.min(G.sw - G.sw / c.z, c.x));
  c.y = Math.max(0, Math.min(G.sh - G.sh / c.z, c.y));
}
const toScene = (x, y) => ({ x: (x - SB.x) / (SB.k * cam.z) + cam.x, y: (y - SB.y) / (SB.k * cam.z) + cam.y });
const toStage = (x, y) => ({ x: SB.x + (x - cam.x) * cam.z * SB.k, y: SB.y + (y - cam.y) * cam.z * SB.k });
const inScene = (x, y) => x >= SB.x && x <= SB.x + SB.w && y >= SB.y && y <= SB.y + SB.h;
function zoomAt(z, sx, sy, target = camT) {     // keep stage point (sx, sy) fixed
  const p = toScene(sx, sy);
  target.z = Math.max(1, Math.min(MAXZ, z));
  target.x = p.x - (sx - SB.x) / (SB.k * target.z); target.y = p.y - (sy - SB.y) / (SB.k * target.z);
  clampCam(target);
}
function focusOn(it) {
  if (cam.z <= 1.01) return;
  camT.z = cam.z; camT.x = it.x - G.sw / cam.z / 2; camT.y = it.y - G.sh / cam.z / 2; clampCam(camT);
}

// ---------- sprites ----------
function typeSprite(t, size) {
  const n = px(size);
  if (t === MOUSE) return sprite('o-mouse', n, (g2, s) => drawObject(g2, s, 'mouse'));
  const c = CATALOG[t];
  return c.kind === 'obj' ? sprite('o-' + c.obj, n, (g2, s) => drawObject(g2, s, c.obj)) : itemSprite(c.chain, c.tier, n);
}
function tinted(t, size, key, col) {
  return sprite(`${key}-${t}`, px(size), (g2, s) => {
    g2.drawImage(typeSprite(t, size), 0, 0, s, s);
    g2.globalCompositeOperation = 'source-in'; g2.fillStyle = col; g2.fillRect(0, 0, s, s);
  });
}
const sceneRes = () => Math.min(MAXZ, Math.ceil(cam.z - 0.15));   // 3 tiers (1, 2, 3) keep memory and redraws low

// ---------- events ----------
function flyCoins(x, y, amount, n = 5) {
  n = Math.max(1, Math.min(n, amount));
  let left = amount;
  for (let k = 0; k < n; k++) {
    const share = k === n - 1 ? left : Math.floor(amount / n); left -= share;
    fly(x, y, 560, 52, (g2, fx, fy) => g2.drawImage(coinIcon(px(36)), fx - 18, fy - 18, 36, 36), 0.6, () => {
      holdCoins -= share; bump.coins = 1; sfx.coin();
    }, k * 0.06);
  }
}

on((type, d) => {
  const t = nowS();
  idleT = 0;
  switch (type) {
    case 'start':
      popup = null; hint = null; marks.length = 0; cardBump.clear(); ptrs.clear(); gesture = null;
      Object.assign(cam, { z: 1, x: 0, y: 0 }); Object.assign(camT, cam);
      fitScene();
      banner = { s: G.theme.name, sub: { picture: `Find the ${G.targets.length} items shown on the list`, shadow: `Find the ${G.targets.length} items by their shadows`, words: `Find the ${G.targets.length} items named on the list` }[G.mode], t0: t };
      break;
    case 'find': {
      const it = d.it, p = toStage(it.x, it.y), c = cardRect(d.index);
      lastFindT = t;
      if (hint && hint.it === it) hint = null;
      burst(p.x, p.y, ['#ffe66d', '#fff', '#ff9de0', '#9dff8a'], 18, 340);
      ring(p.x, p.y, '#fff', it.size * cam.z * SB.k * 0.7);
      sfx.pop(2 + Math.min(d.combo, 6), d.combo);
      if (d.combo >= 2) floatText(p.x, p.y - 50, `Combo x${d.combo}!`, d.combo >= 4 ? '#ff7ac0' : '#9dff8a', 28 + Math.min(d.combo, 6) * 2);
      const s0 = it.size * cam.z * SB.k, card = () => cardRect(d.index);   // re-read: the layout can change mid-flight (rotate/resize)
      fly(p.x, p.y, () => card().x + card().w / 2, () => card().y + card().h / 2, (g2, fx, fy, q) => {
        const s = s0 + (card().h * 0.7 - s0) * q;
        g2.drawImage(typeSprite(it.t, 120), fx - s / 2, fy - s / 2, s, s);
      }, 0.5, () => { cardBump.set(d.index, nowS()); sfx.coin(); }, 0, -120);
      holdCoins += d.coins; flyCoins(p.x, p.y, d.coins, Math.min(3, d.coins));
      if (d.combo >= 3) addShake(2 + d.combo);
      break;
    }
    case 'mouse': {
      const p = toStage(d.it.x, d.it.y);
      sfx.lucky();
      burst(p.x, p.y, ['#ffe66d', '#fff3a6', '#ffd23f', '#fff'], 40, 520, { up: 120 });
      ring(p.x, p.y, '#ffe66d', 110);
      floatText(p.x, p.y - 60, 'Golden Mouse!', '#ffe14a', 36);
      floatText(p.x, p.y - 20, `+${d.coins}`, '#fff3a6', 30, { delay: 0.2 });
      holdCoins += d.coins; flyCoins(p.x, p.y, d.coins, 5);
      break;
    }
    case 'miss': {
      marks.push({ x: d.x, y: d.y, t0: t });
      const p = toStage(d.x, d.y);
      floatText(p.x, p.y - 30, `-${d.penalty}s`, '#ff8a8a', 30);
      sfx.error(); addShake(4); bump.timer = 1;
      break;
    }
    case 'tick': sfx.tick(); bump.timer = 1; break;
    case 'win': {
      holdCoins += d.bonus;   // banked now, shown when the coins fly in from the popup
      const lv = d.level;
      setTimeout(() => {
        if (!G || G.level !== lv || G.state !== 'win') return;
        popup = { type: 'win', d, t0: performance.now() };
        sfx.level();
        const b = popPt(360, 500);
        burst(b.x, b.y, ['#ffe66d', '#ff9de0', '#9dff8a', '#8ad8ff', '#fff'], 70, 750, { up: 220 });
        if (d.mouseMilestone) portal.happy();   // celebrations stay rare: every 5th golden mouse
      }, 700);
      break;
    }
    case 'lose': {
      // the "watch an ad to keep playing" offer: once per room and not on every loss (portal rule); coins always work
      const ad = adOffer() && (!portal.hasAds || (!G.adRevive && loseCount++ % 2 === 0));
      sfx.lose(); popup = { type: 'lose', t0: performance.now(), ad };
      break;
    }
    case 'hint': hint = { it: d.it, t0: t }; focusOn(d.it); sfx.discover(); break;
    case 'freeze': floatText(SB.x + SB.w / 2, SB.y + 40, 'Time frozen!', '#bff6ff', 36); bump.timer = 1; sfx.energy(); break;
    case 'time': floatText(SB.x + SB.w / 2, SB.y + 40, `+${d.add}s`, '#bff6ff', 40); bump.timer = 1; sfx.energy(); popup = null; break;
    case 'boostGain': {
      sfx.coin();
      const b = boostRect(BOOSTS.findIndex(x => x.k === d.kind));
      const nm = { hint: ['Hint', 'Hints'], freeze: ['Freeze', 'Freezes'], time: ['Time boost', 'Time boosts'] }[d.kind][d.n === 1 ? 0 : 1];
      floatText(b.x + b.w / 2, b.y - 14, `+${d.n} ${nm}`, '#fff3a6', 30, { delay: 0.25 });
      break;
    }
  }
});

const pause = (mute = true) => { paused = true; if (mute) duck(true); };
const resume = () => { paused = false; duck(false); };

// ---------- buttons ----------
const buttons = [];
let layer = 0;
const press = { id: null, b: null };
let baseInv = null;   // inverse of the frame's base transform, set each frame
function reg(id, x, y, w, h, onTap) {
  if (baseInv) {
    const m = baseInv.multiply(g.getTransform());
    const x0 = m.a * x + m.c * y + m.e, y0 = m.b * x + m.d * y + m.f;
    const x1 = m.a * (x + w) + m.c * (y + h) + m.e, y1 = m.b * (x + w) + m.d * (y + h) + m.f;
    x = Math.min(x0, x1); y = Math.min(y0, y1); w = Math.abs(x1 - x0); h = Math.abs(y1 - y0);
  }
  buttons.push({ id, x, y, w, h, onTap, layer });
}
function hitButton(x, y) {
  const min = popup ? 1 : 0;
  for (let k = buttons.length - 1; k >= 0; k--) {
    const b = buttons[k];
    if (b.layer >= min && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}
function button(id, x, y, w, h, label, onTap, o = {}) {
  const down = press.id === id, base = o.disabled ? '#9a8fa8' : (o.color || '#4cc35a');
  g.save();
  if (o.pulse && !o.disabled) { const s = 1 + 0.045 * Math.sin(performance.now() / 140); g.translate(x + w / 2, y + h / 2); g.scale(s, s); g.translate(-(x + w / 2), -(y + h / 2)); }
  const dy = down ? 4 : 0, r = Math.min(h / 2, 24);
  rrect(g, x, y + 6, w, h, r); g.fillStyle = shade(base, -0.4); g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
  rrect(g, x, y + dy, w, h, r); g.fillStyle = lg(g, 0, y, 0, y + h, [[0, shade(base, 0.3)], [1, base]]); g.fill(); g.stroke();
  rrect(g, x + 10, y + dy + 5, w - 20, h * 0.3, h * 0.15); g.fillStyle = 'rgba(255,255,255,0.32)'; g.fill();
  let tx = x + w / 2;
  if (o.icon) { const iw = h * 0.6; g.drawImage(o.icon, x + 14, y + dy + (h - iw) / 2, iw, iw); tx += iw * 0.4; }
  text(g, label, tx, y + dy + h / 2 + 1, o.size || Math.min(30, h * 0.48), '#fff');
  g.restore();
  if (!o.disabled) reg(id, x, y, w, h + 6, onTap);
}

// ---------- icons ----------
function iconBulb(x, y, r) {
  circle(g, x, y - r * 0.15, r * 0.55); g.fillStyle = '#fff36b'; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  rrect(g, x - r * 0.25, y + r * 0.3, r * 0.5, r * 0.32, 4); g.fillStyle = '#c9c2d6'; g.fill(); g.stroke();
}
function iconSnow(x, y, r, col = '#fff') {
  g.save(); g.strokeStyle = col; g.lineWidth = r * 0.14; g.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const a = k * Math.PI / 3; const c = Math.cos(a), s = Math.sin(a);
    g.beginPath(); g.moveTo(x - c * r * 0.6, y - s * r * 0.6); g.lineTo(x + c * r * 0.6, y + s * r * 0.6); g.stroke();
    for (const e of [-1, 1]) {
      const ex = x + e * c * r * 0.4, ey = y + e * s * r * 0.4;
      g.beginPath(); g.moveTo(ex, ey);
      g.lineTo(ex + e * (Math.cos(a + 0.7) * r * 0.2), ey + e * (Math.sin(a + 0.7) * r * 0.2));
      g.moveTo(ex, ey); g.lineTo(ex + e * (Math.cos(a - 0.7) * r * 0.2), ey + e * (Math.sin(a - 0.7) * r * 0.2)); g.stroke();
    }
  }
  g.restore();
}
function iconClock(x, y, r, col = '#fff') {
  circle(g, x, y, r * 0.6); g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - r * 0.38); g.moveTo(x, y); g.lineTo(x + r * 0.28, y + r * 0.1); g.lineWidth = r * 0.12; g.lineCap = 'round'; g.stroke();
}
function iconLens(x, y, r, plus) {
  g.save(); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + r * 0.3, y + r * 0.3); g.lineTo(x + r * 0.7, y + r * 0.7); g.lineWidth = r * 0.3; g.strokeStyle = OUT; g.stroke(); g.lineWidth = r * 0.16; g.strokeStyle = '#c07a3a'; g.stroke();
  circle(g, x - r * 0.08, y - r * 0.08, r * 0.46); g.fillStyle = 'rgba(200,240,255,0.9)'; g.fill(); g.lineWidth = r * 0.14; g.strokeStyle = OUT; g.stroke();
  g.beginPath(); g.moveTo(x - r * 0.3, y - r * 0.08); g.lineTo(x + r * 0.14, y - r * 0.08); if (plus) { g.moveTo(x - r * 0.08, y - r * 0.3); g.lineTo(x - r * 0.08, y + r * 0.14); }
  g.lineWidth = r * 0.12; g.strokeStyle = OUT; g.stroke();
  g.restore();
}
function speaker(x, y, r, muted) {
  g.save(); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - r * 0.5, y - r * 0.2); g.lineTo(x - r * 0.25, y - r * 0.2); g.lineTo(x + r * 0.1, y - r * 0.5); g.lineTo(x + r * 0.1, y + r * 0.5); g.lineTo(x - r * 0.25, y + r * 0.2); g.lineTo(x - r * 0.5, y + r * 0.2); g.closePath(); g.fill();
  g.beginPath();
  if (muted) { g.moveTo(x + r * 0.25, y - r * 0.25); g.lineTo(x + r * 0.6, y + r * 0.25); g.moveTo(x + r * 0.6, y - r * 0.25); g.lineTo(x + r * 0.25, y + r * 0.25); }
  else { g.arc(x + r * 0.15, y, r * 0.3, -0.9, 0.9); g.moveTo(x + r * 0.15 + r * 0.55 * Math.cos(-0.9), y + r * 0.55 * Math.sin(-0.9)); g.arc(x + r * 0.15, y, r * 0.55, -0.9, 0.9); }
  g.stroke(); g.restore();
}

// ---------- drawing ----------
const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 977) % 2400 - 840, y: (i * 613) % 1500 - 110, s: 1 + (i * 37 % 10) / 3, p: i * 1.7 }));
function drawBackground(t) {
  const { vx, vy, vw, vh } = view;
  g.fillStyle = lg(g, 0, vy, 0, vy + vh, [[0, '#1d1440'], [0.5, '#35225e'], [1, '#4f2a66']]);
  g.fillRect(vx - 2, vy - 2, vw + 4, vh + 4);
  for (const s of stars) {
    if (s.x < vx || s.x > vx + vw || s.y < vy || s.y > vy + vh) continue;
    if (s.y > 6 && s.y < 80 && s.x > 0 && s.x < StW) continue;   // keep the top bar clean (no sparkle beside the pills)
    if (land ? (s.x > SB.x - 10 && s.x < SB.x + SB.w + 10 && s.y > SB.y - 10 && s.y < SB.y + SB.h + 10) || (s.x > LY.panel.x - 14 && s.x < LY.panel.x + LY.panel.w + 14 && s.y > LY.panel.y - 10 && s.y < LY.panel.y + LY.panel.h + 10)
      : (s.x > 0 && s.x < W && s.y > SB.y - 10)) continue;
    g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + s.p));
    sparkle(g, s.x, s.y, s.s * 2.2, '#fff6dc');
  }
  g.globalAlpha = 1;
}
function pill(x, y, w, h) {
  rrect(g, x, y + 4, w, h, h / 2); g.fillStyle = 'rgba(15,5,30,0.5)'; g.fill();
  rrect(g, x, y, w, h, h / 2); g.fillStyle = 'rgba(43,26,61,0.88)'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#140a24'; g.stroke();
}
function drawHUD(t) {
  const lv = 16, tx = land ? LY.box.x + LY.box.w / 2 : 360, cx = land ? StW - 262 : 476, mx = land ? StW - 46 : 676;
  pill(lv, 18, 176, 50);
  text(g, `Level ${G.level}`, lv + 88, 44, 28, '#fff');
  const left = Math.ceil(G.timeLeft), low = left <= 10 && G.started, frozen = G.freeze > 0;
  const ts = 1 + bump.timer * 0.25;
  g.save(); g.translate(tx, 44); g.scale(ts, ts);
  rrect(g, -100, -30, 200, 60, 30);
  g.fillStyle = frozen ? '#3a8ac8' : low ? (Math.sin(t * 10) > 0 ? '#c0304a' : '#8a1e34') : 'rgba(43,26,61,0.92)'; g.fill();
  g.lineWidth = 4; g.strokeStyle = '#140a24'; g.stroke();
  if (frozen) iconSnow(-62, 0, 34); else iconClock(-62, 0, 36, low ? '#ffd0d0' : '#bff6ff');
  text(g, `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 18, 2, 34, '#fff');
  g.restore();
  pill(cx, 20, 150, 46);
  const cs = 1 + bump.coins * 0.3;
  g.save(); g.translate(cx + 24, 43); g.scale(cs, cs); g.drawImage(coinIcon(px(50)), -25, -25, 50, 50); g.restore();
  text(g, String(Math.round(dispCoins)), cx + 92, 45, 26, '#ffe680');
  const down = press.id === 'mute';
  circle(g, mx, 47, 28); g.fillStyle = '#4a2c8a'; g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
  circle(g, mx, 43 + (down ? 3 : 0), 28); g.fillStyle = lg(g, 0, 15, 0, 71, [[0, '#9a7cf0'], [1, '#6b4cc6']]); g.fill(); g.stroke();
  speaker(mx, 43 + (down ? 3 : 0), 26, isMuted());
  reg('mute', mx - 28, 15, 56, 60, () => { P.muted = !isMuted(); applyMute(); saveProfile(); });
  if (land) return;   // landscape shows these in the side panel
  // sub line: theme · found · golden mouse
  const msg = `${G.theme.name}  ·  ${G.found.size}/${G.targets.length} found`;
  text(g, msg, 316, 93, fitFont(msg, 540, 23), '#efe6ff', { stroke: false, weight: 800 });
  mouseBadge(604, 72);
}
function mouseBadge(x, y) {
  g.save(); g.globalAlpha = G.mouseFound ? 1 : 0.35;
  g.drawImage(typeSprite(MOUSE, 44), x, y - 2, 44, 44);
  g.restore();
  text(g, G.mouseFound ? '✓' : '?', x + 58, y + 21, 26, G.mouseFound ? '#9dff8a' : '#e6dcff', { lw: 5 });
}

function drawScene(t, dt) {
  fitScene();
  // ease camera toward its target (button/wheel); pinch sets both directly
  const k = 1 - Math.exp(-dt * 12);
  cam.z += (camT.z - cam.z) * k; cam.x += (camT.x - cam.x) * k; cam.y += (camT.y - cam.y) * k;
  clampCam(cam);
  const { x: SX, y: SY, w: SW, h: SH } = SB, Z = SB.k * cam.z;
  rrect(g, SX - 4, SY + 4, SW + 8, SH + 8, 26); g.fillStyle = 'rgba(10,5,20,0.55)'; g.fill();
  g.save();
  rrect(g, SX, SY, SW, SH, 24); g.clip();
  g.translate(SX, SY); g.scale(Z, Z); g.translate(-cam.x, -cam.y);
  const rres = view.res * SB.k * sceneRes();
  g.drawImage(roomCanvas(G.room, 'back', rres), 0, 0, G.sw, G.sh);
  const sr = sceneRes(), base = 120 * sr * SB.k;
  for (const it of G.items) {
    if (it.target && G.found.has(it.id)) continue;
    if (it.gold && G.mouseFound) continue;
    const s = it.size;
    if (it.sit && !it.back) { oval(it.x, it.y + s * 0.38, s * 0.3, s * 0.06); g.fillStyle = 'rgba(15,5,25,0.28)'; g.fill(); }
    g.save(); g.translate(it.x, it.y); g.rotate(it.rot); if (it.flip) g.scale(-1, 1);
    if (!it.sit) { g.globalAlpha = 0.3; g.drawImage(tinted(it.t, base, 'sh', '#140a24'), -s / 2 + 3, -s / 2 + 6, s, s); g.globalAlpha = 1; }
    g.drawImage(typeSprite(it.t, base), -s / 2, -s / 2, s, s);
    g.restore();
  }
  g.drawImage(roomCanvas(G.room, 'front', rres), 0, 0, G.sw, G.sh);
  // hint spotlight
  if (hint) {
    const a = t - hint.t0;
    if (a > 5 || G.found.has(hint.it.id)) hint = null;
    else {
      const it = hint.it, r = it.size * (0.75 + 0.08 * Math.sin(t * 6)), fade = Math.min(1, a / 0.3) * (a > 4.4 ? (5 - a) / 0.6 : 1);
      g.save(); g.globalAlpha = 0.55 * fade; g.fillStyle = '#0e0620';
      g.beginPath(); g.rect(cam.x - 5, cam.y - 5, G.sw / cam.z + 10, G.sh / cam.z + 10); g.arc(it.x, it.y, r, 0, Math.PI * 2, true); g.fill('evenodd');
      g.globalAlpha = fade; circle(g, it.x, it.y, r); g.lineWidth = 6 / Z + 2; g.strokeStyle = '#fff36b'; g.setLineDash([12, 10]); g.lineDashOffset = -t * 30; g.stroke();
      g.restore();
    }
  }
  // first room: point at the first item until the player gets the idea
  if (G.level === 1 && G.found.size === 0 && !popup && !banner && idleT > 0.8) {
    const it = G.byId.get(G.targets[0]);
    g.save(); g.globalAlpha = 0.9; circle(g, it.x, it.y, it.size * (0.7 + 0.06 * Math.sin(t * 6))); g.lineWidth = 5 / Z; g.strokeStyle = '#fff36b'; g.stroke(); g.restore();
    drawHand(it.x + 10, it.y + 14 + Math.sin(t * 6) * 6, 0.8 / Z);
  }
  // miss crosses
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i], a = t - m.t0;
    if (a > 0.7) { marks.splice(i, 1); continue; }
    const r = 20 / Z * (1 + a * 0.4);
    g.save(); g.globalAlpha = 1 - a / 0.7; g.strokeStyle = '#ff4d6a'; g.lineWidth = 9 / Z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(m.x - r, m.y - r); g.lineTo(m.x + r, m.y + r); g.moveTo(m.x + r, m.y - r); g.lineTo(m.x - r, m.y + r); g.stroke(); g.restore();
  }
  g.restore();
  // frost when frozen
  if (G.freeze > 0) {
    g.save(); rrect(g, SX, SY, SW, SH, 24); g.clip();
    const a = Math.min(1, G.freeze / 1.5) * 0.9;
    g.globalAlpha = a; g.fillStyle = rg(g, SX + SW / 2, SY + SH / 2, Math.min(SW, SH) * 0.35, Math.max(SW, SH) * 0.8, [[0, 'rgba(180,230,255,0)'], [1, 'rgba(180,230,255,0.55)']]);
    g.fillRect(SX, SY, SW, SH); g.restore();
  }
  rrect(g, SX, SY, SW, SH, 24); g.lineWidth = 6; g.strokeStyle = OUT; g.stroke();
  rrect(g, SX + 5, SY + 5, SW - 10, SH - 10, 20); g.lineWidth = 3; g.strokeStyle = 'rgba(255,220,150,0.35)'; g.stroke();
  // zoom button
  const zx = SX + SW - 46, zy = SY + 46, zoomed = camT.z > 1.05, down = press.id === 'zoom';
  circle(g, zx, zy + 4, 30); g.fillStyle = 'rgba(15,5,30,0.6)'; g.fill();
  circle(g, zx, zy + (down ? 3 : 0), 30); g.fillStyle = 'rgba(255,248,234,0.92)'; g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
  iconLens(zx, zy + (down ? 3 : 0), 30, !zoomed);
  reg('zoom', zx - 34, zy - 34, 68, 72, () => {
    if (zoomed) Object.assign(camT, { z: 1, x: 0, y: 0 });
    else zoomAt(2.2, SX + SW / 2, SY + SH / 2);
  });
  if (G.level === 1 && !popup && !banner) {
    const msg = G.found.size === 0 ? 'Spot an item from the list and tap it!' : G.found.size < 3 ? 'Pinch, scroll or tap 🔍 to zoom in' : '';
    if (msg) {
      g.font = `800 22px ${FONT}`; const tw = g.measureText(msg).width + 40;
      const ty = toStage(0, G.byId.get(G.targets[0]).y).y < SY + SH / 2 ? SY + SH - 62 : SY + 16;   // stay clear of the item the hand points at
      rrect(g, SX + SW / 2 - tw / 2, ty, tw, 44, 22); g.fillStyle = 'rgba(30,15,50,0.86)'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#ffe14a'; g.stroke();
      text(g, msg, SX + SW / 2, ty + 23, 22, '#fff', { stroke: false });
    }
  }
}

function drawHand(x, y, sc = 1) {
  const s = 96;
  const spr = sprite('hand', px(s), (g2, ss) => {
    g2.lineJoin = 'round'; g2.lineWidth = ss * 0.05; g2.strokeStyle = OUT; g2.fillStyle = '#fff';
    g2.save(); g2.translate(ss * 0.5, ss * 0.55); g2.rotate(-0.5);
    rrect(g2, -ss * 0.07, -ss * 0.48, ss * 0.14, ss * 0.42, ss * 0.07); g2.fill(); g2.stroke();
    rrect(g2, -ss * 0.2, -ss * 0.12, ss * 0.42, ss * 0.4, ss * 0.12); g2.fill(); g2.stroke();
    rrect(g2, ss * 0.07, -ss * 0.18, ss * 0.12, ss * 0.2, ss * 0.06); g2.fill(); g2.stroke();
    rrect(g2, -ss * 0.26, -ss * 0.05, ss * 0.12, ss * 0.2, ss * 0.06); g2.fill(); g2.stroke();
    g2.restore();
  });
  g.drawImage(spr, x - s * 0.3 * sc, y - s * 0.13 * sc, s * sc, s * sc);
}

// ---------- item list ----------
function listArea() {
  if (!land) return LY.tray;
  const P0 = LY.panel, top = P0.y + 96;
  return { x: P0.x + 14, y: top, w: P0.w - 28, h: boostRect(0).y - 16 - top };
}
function trayGrid() {
  const A = listArea(), n = G.targets.length, words = G.mode === 'words', gap = 10;
  const per = land ? (words ? ((A.h - (n - 1) * gap) / n >= 46 ? 1 : 2) : (n <= 4 ? 2 : 3)) : (words ? (n > 9 ? 4 : 3) : (n <= 6 ? n : Math.ceil(n / 2)));
  const rows = Math.ceil(n / per);
  const cw = Math.min(words ? 1e3 : 130, (A.w - (per - 1) * gap) / per);
  const ch = Math.min(words ? 54 : 150, (A.h - (rows - 1) * gap) / rows);
  return { A, n, rows, per, gap, cw, ch };
}
function cardRect(i) {
  const { A, n, rows, per, gap, cw, ch } = trayGrid();
  const r = Math.floor(i / per), inRow = r === rows - 1 ? n - per * (rows - 1) : per, c = i % per;
  const rowW = inRow * cw + (inRow - 1) * gap;
  const y0 = A.y + (A.h - (rows * ch + (rows - 1) * gap)) / 2;
  return { x: A.x + (A.w - rowW) / 2 + c * (cw + gap), y: y0 + r * (ch + gap), w: cw, h: ch };
}
function fitFont(s, maxW, size, min = 11) {
  g.font = `800 ${size}px ${FONT}`;
  while (size > min && g.measureText(s).width > maxW) g.font = `800 ${--size}px ${FONT}`;
  return size;
}
// A card label: one line if it fits at a readable size, else two lines split at a space.
function labelLines(s, maxW) {
  const one = fitFont(s, maxW, 20, 10);
  if (one >= 17 || !s.includes(' ')) return { rows: [s], size: one };
  const sp = s.split(' '), cut = Math.ceil(sp.length / 2), rows = [sp.slice(0, cut).join(' '), sp.slice(cut).join(' ')];
  return { rows, size: Math.min(20, ...rows.map(r => fitFont(r, maxW, 20, 10))) };
}
function drawSidePanel() {
  if (!land) return;
  const P0 = LY.panel;
  rrect(g, P0.x - 4, P0.y + 4, P0.w + 8, P0.h, 26); g.fillStyle = 'rgba(10,5,20,0.45)'; g.fill();
  rrect(g, P0.x, P0.y, P0.w, P0.h, 24); g.fillStyle = 'rgba(43,26,61,0.78)'; g.fill(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke();
  text(g, G.theme.name, P0.x + P0.w / 2, P0.y + 32, fitFont(G.theme.name, P0.w - 30, 26), '#ffe680');
  text(g, `${G.found.size} / ${G.targets.length} found`, P0.x + P0.w / 2 - 40, P0.y + 68, 24, '#efe6ff', { stroke: false });
  mouseBadge(P0.x + P0.w - 112, P0.y + 47);
}
function drawTray(t) {
  drawSidePanel();
  const words = G.mode === 'words';
  G.targets.forEach((id, i) => {
    const it = G.byId.get(id), c = cardRect(i), found = G.found.has(id);
    const b = cardBump.get(i), bk = b ? Math.max(0, Math.min(1, 1 - (t - b) / 0.35)) : 0;
    const arrived = found && b, hinted = hint && hint.it.id === id && !found;
    const r = Math.min(16, c.h / 2);
    g.save(); g.translate(c.x + c.w / 2, c.y + c.h / 2); const s = 1 + 0.18 * Math.sin(bk * Math.PI); g.scale(s, s); g.translate(-(c.x + c.w / 2), -(c.y + c.h / 2));
    rrect(g, c.x, c.y + 4, c.w, c.h, r); g.fillStyle = 'rgba(15,5,30,0.5)'; g.fill();
    rrect(g, c.x, c.y, c.w, c.h, r);
    g.fillStyle = arrived ? lg(g, 0, c.y, 0, c.y + c.h, [[0, '#d8ffd0'], [1, '#9be88e']]) : lg(g, 0, c.y, 0, c.y + c.h, [[0, '#fff8ee'], [1, '#f2dcc0']]);
    g.fill(); g.lineWidth = 4; g.strokeStyle = hinted ? '#ffd23f' : OUT; g.stroke();
    const name = CATALOG[it.t].name;
    if (words) {
      // a word list: the name, crossed off when found; a hint flashes the picture next to it
      const isz = c.h * 0.8, ix = hinted ? isz + 4 : 0;
      if (hinted) g.drawImage(typeSprite(it.t, isz), c.x + 6, c.y + (c.h - isz) / 2, isz, isz);
      const fs = fitFont(name, c.w - 20 - ix, Math.min(26, c.h * 0.54));
      g.globalAlpha = found ? 0.5 : 1;
      text(g, name, c.x + c.w / 2 + ix / 2, c.y + c.h / 2 + 1, fs, '#5a2f8a', { stroke: false });
      g.globalAlpha = 1;
      if (arrived) {
        const tw = g.measureText(name).width;
        g.beginPath(); g.moveTo(c.x + c.w / 2 - tw / 2 - 4, c.y + c.h / 2); g.lineTo(c.x + c.w / 2 + tw / 2 + 4, c.y + c.h / 2);
        g.lineWidth = 4; g.strokeStyle = '#2f8a3a'; g.stroke();
      }
    } else {
      const isz = Math.min(c.w, c.h) * 0.78;
      if (arrived) {
        g.globalAlpha = 0.45; g.drawImage(typeSprite(it.t, isz), c.x + (c.w - isz) / 2, c.y + (c.h - isz) / 2, isz, isz); g.globalAlpha = 1;
        g.beginPath(); g.moveTo(c.x + c.w * 0.3, c.y + c.h * 0.52); g.lineTo(c.x + c.w * 0.45, c.y + c.h * 0.68); g.lineTo(c.x + c.w * 0.72, c.y + c.h * 0.34);
        g.lineCap = 'round'; g.lineWidth = 12; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 6; g.strokeStyle = '#4cc35a'; g.stroke();
      } else if (!found) {
        const spr = G.mode === 'shadow' && !hinted ? tinted(it.t, isz, 'sil', '#3a2456') : typeSprite(it.t, isz);
        const lines = c.h > 120 ? labelLines(name, c.w - 10) : null;
        const lh = lines ? lines.size * 1.05 * lines.rows.length + 8 : 0, sz = lines ? Math.min(isz, c.h - lh - 8) : isz;
        g.drawImage(spr, c.x + (c.w - sz) / 2, c.y + (c.h - lh - sz) / 2 + 2, sz, sz);
        if (lines) lines.rows.forEach((r, k) => text(g, r, c.x + c.w / 2, c.y + c.h - lh + 2 + lines.size * 1.05 * (k + 0.5), lines.size, '#5a2f8a', { stroke: false }));
      }
    }
    g.restore();
  });
}

const BOOSTS = [
  { k: 'hint', label: 'Hint', icon: iconBulb, color: '#e8a33c' },
  { k: 'freeze', label: 'Freeze', icon: (x, y, r) => iconSnow(x, y, r * 0.9), color: '#3aa8d8' },
  { k: 'time', label: `+${TIME_ADD}s`, icon: (x, y, r) => iconClock(x, y, r, '#bff6ff'), color: '#43b94f' },
];
function boostRect(i) {
  if (land) {
    const P0 = LY.panel, h = 64, gap = 14, y0 = P0.y + P0.h - (3 * h + 2 * gap) - 18;
    return { x: P0.x + 18, y: y0 + i * (h + gap), w: P0.w - 36, h };
  }
  const w = 212, h = 96, gap = 16, x0 = (W - (3 * w + 2 * gap)) / 2;
  return { x: x0 + i * (w + gap), y: StH - 120, w, h };
}
function drawBoosters() {
  BOOSTS.forEach((b, i) => {
    const { x, y, w, h } = boostRect(i), id = 'b-' + b.k, down = press.id === id, dy = down ? 4 : 0;
    rrect(g, x, y + 6, w, h, 26); g.fillStyle = shade(b.color, -0.45); g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    rrect(g, x, y + dy, w, h, 26); g.fillStyle = lg(g, 0, y, 0, y + h, [[0, shade(b.color, 0.3)], [1, b.color]]); g.fill(); g.stroke();
    b.icon(x + 50, y + dy + h / 2, land ? 40 : 44);
    text(g, b.label, land ? x + w / 2 + 20 : x + 128, y + dy + h / 2 + 1, land ? 28 : 26, '#fff');
    const n = P.boost[b.k];
    circle(g, x + w - 14, y + 10 + dy, 20); g.fillStyle = n > 0 ? '#ff4d7a' : '#43b94f'; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
    text(g, n > 0 ? String(n) : '+', x + w - 14, y + 11 + dy, 22, '#fff', { stroke: false });
    reg(id, x, y, w, h + 6, () => {
      if (G.state !== 'play') return;
      if (b.k === 'freeze' && G.freeze > 0) { sfx.error(); return; }
      if (b.k === 'hint' && hint) { focusOn(hint.it); return; }   // a hint is already showing: don't spend another
      if (P.boost[b.k] > 0) { if (!useBoost(b.k)) sfx.error(); }
      else popup = { type: 'boost', kind: b.k, t0: performance.now() };
    });
  });
}

function drawBanner(t) {
  if (!banner) return;
  const a = t - banner.t0;
  if (a > 2) { banner = null; return; }
  const inK = Math.min(1, a / 0.35), outK = a > 1.6 ? (a - 1.6) / 0.4 : 0;
  g.save(); g.globalAlpha = 1 - outK;
  const s = E.outBack(inK);
  g.translate(SB.x + SB.w / 2, SB.y + SB.h * 0.42); g.scale(s, s);
  rrect(g, -290, -70, 580, 140, 40); g.fillStyle = 'rgba(43,26,61,0.94)'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#ffe14a'; g.stroke();
  text(g, banner.s, 0, -14, 48, '#ffe14a');
  text(g, banner.sub, 0, 34, 22, '#e6dcff', { stroke: false, weight: 700 });
  g.restore();
}

// ---------- popups ----------
function panel(x, y, w, h, title, color) {
  rrect(g, x, y + 8, w, h, 34); g.fillStyle = 'rgba(30,15,50,0.5)'; g.fill();
  rrect(g, x, y, w, h, 34); g.fillStyle = lg(g, 0, y, 0, y + h, [[0, '#fff8ee'], [1, '#f6e3c8']]); g.fill(); g.lineWidth = 6; g.strokeStyle = OUT; g.stroke();
  const rw = Math.min(w - 40, 460), rx = x + (w - rw) / 2;
  rrect(g, rx, y - 34, rw, 72, 30); g.fillStyle = lg(g, 0, y - 34, 0, y + 38, [[0, shade(color, 0.25)], [1, color]]); g.fill(); g.stroke();
  text(g, title, x + w / 2, y + 2, 42, '#fff');
}
// Small "more games" link under the end-of-room popups. Opens the studio page in a new tab via a real
// <a target="_blank" rel="noopener"> click, made inside the tap so popup blockers allow it.
// Set MORE_URL = '' to remove the link.
const MORE_URL = 'https://lumiolab.itch.io';
function openMore() {
  const a = document.createElement('a');
  a.href = MORE_URL; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}
function moreLink(y) {
  if (!MORE_URL) return;
  const label = 'More games from LumioLab \u2197', size = 22;
  g.font = `700 ${size}px ${FONT}`;
  const w = g.measureText(label).width;
  const down = press.id === 'more';
  g.save(); g.globalAlpha = down ? 0.7 : 0.9;
  text(g, label, 360, y, size, '#e9dcff', { weight: 700, lw: 4 });
  g.fillStyle = '#e9dcff'; g.fillRect(360 - w / 2, y + size * 0.62, w, 2);
  g.restore();
  reg('more', 360 - w / 2 - 16, y - 24, w + 32, 48, openMore);
}
function rewardedThen(fn) {
  const pp = popup;
  portal.rewarded(pause, resume).then(ok => {
    if (ok) { fn(); return; }
    adBroken = true;   // don't keep offering ads that can't play
    if (popup && popup === pp) popup.err = performance.now();   // shown on top of the popup (no reward on ad error)
    else floatText(StW / 2, StH / 2, 'No ad right now, try again later', '#ffb3b3', 28);
  });
}
const adLabel = portal.hasAds ? 'Watch ad' : 'Free';
function drawPopup(t) {
  if (!popup) return;
  layer = 1;
  const age = (performance.now() - popup.t0) / 1000;
  g.fillStyle = `rgba(14,6,28,${0.66 * Math.min(1, age / 0.2)})`;
  g.fillRect(view.vx - 2, view.vy - 2, view.vw + 4, view.vh + 4);
  reg('blocker', view.vx, view.vy, view.vw, view.vh, () => {});
  const s = E.outBack(Math.min(1, age / 0.35));
  const fitK = popupK();   // popups are laid out around (360, 640); shrink to fit short stages
  g.save(); g.translate(StW / 2, StH / 2); g.scale(s * fitK, s * fitK); g.translate(-360, -640);
  const p = popup;
  if (p.type === 'win') {
    const y = 340, h = 600;
    g.save(); g.translate(360, y + 150); g.rotate(t * 0.4);
    for (let k = 0; k < 12; k++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -340); g.lineTo(40, -340); g.closePath(); g.fillStyle = 'rgba(255,230,120,0.12)'; g.fill(); }
    g.restore();
    panel(110, y, 500, h, 'Room Cleared!', '#ff7ac0');
    for (let k = 0; k < 3; k++) {
      const appear = Math.max(0, Math.min(1, (age - 0.3 - k * 0.25) / 0.3));
      const lit = k < p.d.stars;
      const sx = 360 + (k - 1) * 130, sy = y + 150 - (k === 1 ? 26 : 0), sz = k === 1 ? 130 : 110;
      g.save(); g.translate(sx, sy); g.globalAlpha = lit ? 1 : 0.25;
      const sc = lit ? E.outBack(appear) : 1; g.scale(sc, sc);
      g.drawImage(starIcon(px(sz)), -sz / 2, -sz / 2, sz, sz);
      g.restore();
      if (lit && appear > 0 && appear < 0.15 && !p['s' + k]) { p['s' + k] = 1; sfx.pop(4 + k * 2, k); }
    }
    g.drawImage(coinIcon(px(60)), 270, y + 250, 60, 60);
    text(g, `+${p.d.coins}`, 340, y + 281, 44, '#e69a00', { align: 'left' });
    g.save(); g.globalAlpha = p.d.mouse ? 1 : 0.4; g.drawImage(typeSprite(MOUSE, 64), 150, y + 330, 64, 64); g.restore();
    text(g, p.d.mouse ? 'Golden mouse found!' : 'The golden mouse escaped…', 228, y + 352, 22, p.d.mouse ? '#c07a00' : '#8a6aa0', { stroke: false, align: 'left' });
    text(g, `Mice collected: ${P.mice.length}`, 228, y + 382, 20, '#8a6aa0', { stroke: false, weight: 700, align: 'left' });
    text(g, `Time left: ${Math.ceil(G.timeLeft)}s`, 360, y + 432, 22, '#8a6aa0', { stroke: false, weight: 700 });
    button('next', 210, y + h - 110, 300, 72, 'Next Room', () => {
      popup = null;
      const c = popPt(300, 650);
      flyCoins(c.x, c.y, p.d.bonus, 8);
      // no interstitial right after a "watch to keep playing" ad in the same room
      (G.adRevive ? Promise.resolve() : portal.midgame(pause, resume)).then(() => startLevel(P.level));
    }, { pulse: age > 1.2, color: '#43b94f' });
    moreLink(y + h + 44);
  } else if (p.type === 'lose') {
    const y = 380, h = 520;
    panel(110, y, 500, h, "Time's Up!", '#e0506a');
    const left = G.targets.length - G.found.size;
    text(g, `${left} item${left === 1 ? '' : 's'} left${left <= Math.max(2, G.targets.length / 3) ? ' — so close!' : ' — keep looking!'}`, 360, y + 100, 26, '#5a2f8a', { stroke: false });
    if (p.ad) button('t-ad', 160, y + 160, 400, 70, `${adLabel}  +${TIME_ADD}s`, () => rewardedThen(() => { G.adRevive = true; reviveTime(); }), { color: '#3aa8d8' });
    button('t-buy', 160, y + (p.ad ? 252 : 206), 400, 70, `+${TIME_ADD}s for ${TIME_COST}`, () => { if (P.coins >= TIME_COST) { P.coins -= TIME_COST; saveProfile(); reviveTime(); } }, { color: '#e8a33c', icon: coinIcon(px(56)), disabled: P.coins < TIME_COST });
    button('retry', 210, y + h - 110, 300, 70, 'Retry', () => { popup = null; startLevel(G.level); }, { color: '#9a7cf0' });
    moreLink(y + h + 44);
  } else if (p.type === 'boost') {
    const b = BOOSTS.find(x => x.k === p.kind), cost = p.kind === 'time' ? TIME_COST : BOOST_COST;
    const y = 410, h = 470;
    panel(130, y, 460, h, { hint: 'More Hints', freeze: 'More Freezes', time: 'More Time' }[p.kind], b.color);
    circle(g, 360, y + 120, 60); g.fillStyle = b.color; g.fill(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke();
    b.icon(360, y + 120, 64);
    const ad = adOffer();
    if (ad) button('bo-ad', 170, y + 210, 380, 66, `${adLabel}  +2`, () => rewardedThen(() => { grantBoost(p.kind, 2); popup = null; }), { color: '#3aa8d8' });
    button('bo-buy', 170, y + (ad ? 296 : 240), 380, 66, `+1 for ${cost}`, () => { if (buyBoost(p.kind)) popup = null; }, { color: '#e8a33c', icon: coinIcon(px(52)), disabled: P.coins < cost });
    button('bo-x', 255, y + h - 76, 210, 54, 'Close', () => { popup = null; }, { color: '#9a7cf0', size: 24 });
  }
  g.restore();
  if (p.err) {
    const a = (performance.now() - p.err) / 1000;
    if (a > 2.6) p.err = 0;
    else {
      const e = popPt(360, p.type === 'lose' ? 940 : 900);
      g.save(); g.globalAlpha = Math.min(1, (2.6 - a) / 0.4);
      text(g, 'No ad right now, try again later', e.x, e.y, 26, '#ffd0d0');
      g.restore();
    }
  }
}

// ---------- input ----------
function toV(e) { return { x: (e.clientX - view.ox) / view.sc, y: (e.clientY - view.oy) / view.sc }; }
let firstInput = true;
const ptrs = new Map();      // active scene pointers
let gesture = null;          // {kind:'tap'|'pan'|'pinch', ...}
cv.addEventListener('pointerdown', e => {
  unlockAudio();
  if (firstInput) { firstInput = false; applyMute(); }
  if (paused) return;
  const p = toV(e);
  idleT = 0;
  const b = hitButton(p.x, p.y);
  if (b) { press.id = b.id; press.b = b; press.pid = e.pointerId; return; }
  if (popup || banner || G.state !== 'play' || !inScene(p.x, p.y)) return;
  ptrs.set(e.pointerId, p);
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  if (ptrs.size === 2) {
    const [a, c] = [...ptrs.values()];
    gesture = { kind: 'pinch', d0: Math.hypot(a.x - c.x, a.y - c.y) || 1, z0: cam.z };
  } else if (ptrs.size === 1) {
    gesture = { kind: 'tap', sx: p.x, sy: p.y, cx: cam.x, cy: cam.y, touch: e.pointerType === 'touch' };
  }
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  const p = toV(e);
  ptrs.set(e.pointerId, p);
  if (!gesture) return;
  if (gesture.kind === 'pinch' && ptrs.size >= 2) {
    const [a, c] = [...ptrs.values()];
    const d = Math.hypot(a.x - c.x, a.y - c.y);
    zoomAt(gesture.z0 * d / gesture.d0, (a.x + c.x) / 2, (a.y + c.y) / 2, cam);
    Object.assign(camT, cam);
  } else if (gesture.kind === 'tap' || gesture.kind === 'pan') {
    if (gesture.kind === 'tap' && Math.hypot(p.x - gesture.sx, p.y - gesture.sy) > 12) gesture.kind = 'pan';
    if (gesture.kind === 'pan') {
      cam.x = gesture.cx - (p.x - gesture.sx) / cam.z; cam.y = gesture.cy - (p.y - gesture.sy) / cam.z;
      clampCam(cam); Object.assign(camT, cam);
    }
  }
});
function endPointer(e, cancel) {
  const p = toV(e);
  if (press.id && e.pointerId === press.pid) {   // only the finger that pressed the button releases it
    const b = press.b; press.id = null; press.b = null;
    if (!cancel && b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { if (b.id !== 'blocker') sfx.tap(); b.onTap(); }
    return;
  }
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (gesture && gesture.kind === 'tap' && !cancel && ptrs.size === 0) {
    const s = toScene(p.x, p.y);
    // finger-sized tap boxes: at least ~36 css px on touch (~24 with a mouse), however small the item is drawn
    const minR = (gesture.touch ? 18 : 12) / (view.sc * SB.k * cam.z);
    tap(s.x, s.y, gesture.touch && cam.z < 1.6 ? 1.15 : 1, minR);
  }
  if (ptrs.size === 0) gesture = null;
  else if (gesture && gesture.kind === 'pinch') gesture = { kind: 'done' };
}
cv.addEventListener('pointerup', e => endPointer(e, false));
cv.addEventListener('pointercancel', e => endPointer(e, true));
cv.addEventListener('wheel', e => {
  e.preventDefault();
  const p = toV(e);
  if (popup || !inScene(p.x, p.y)) return;
  zoomAt(camT.z * Math.exp(-e.deltaY * 0.0022), p.x, p.y);
}, { passive: false });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerup', () => unlockAudio());   // iOS Safari only unlocks audio on touchend/click
// Hidden tab: stop the clock + sound. Portal gameplay events are left alone (the portals track focus themselves).
document.addEventListener('visibilitychange', () => {
  tabHidden = document.hidden;
  suspendAudio(tabHidden);
});

// Portal gameplayStart/Stop follow the screen: only an active room counts (not popups or ads).
function syncGameplay() {
  if (!paused && !popup && G.state === 'play') portal.gameplayStart();
  else portal.gameplayStop();
}

// ---------- loop ----------
let last = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
  const t = nowS();   // same clock as the event timestamps (rAF's ts can trail performance.now)
  requestAnimationFrame(frame);   // keep the loop alive even if a draw throws
  if (!banner && G.state === 'play') G.started = true;   // clock runs from the moment the intro banner ends
  syncGameplay();
  if (!paused && !tabHidden && !popup && !banner) tick(dt);
  updateFx(dt);
  bump.coins = Math.max(0, bump.coins - dt * 4); bump.timer = Math.max(0, bump.timer - dt * 4);
  dispCoins += (P.coins + G.coinsEarned - holdCoins - dispCoins) * (1 - Math.exp(-dt * 10));
  if (!popup && G.state === 'play') idleT += dt;
  g.setTransform(view.res, 0, 0, view.res, (view.ox + shake.x * view.sc) * dpr, (view.oy + shake.y * view.sc) * dpr);
  baseInv = g.getTransform().inverse();
  buttons.length = 0; layer = 0;
  drawBackground(t);
  drawHUD(t);
  drawScene(t, dt);
  drawTray(t);
  drawBoosters();
  drawParticles(g);
  drawFlyers(g);
  drawBanner(t);
  drawPopup(t);
}

async function boot() {
  resize();
  await portal.init();
  setStore(portal.store);
  loadProfile();
  dispCoins = P.coins;
  applyMute();
  portal.onSettings(applyMute);
  const q = new URLSearchParams(location.search);
  const ql = Math.floor(+q.get('level'));
  startLevel(ql >= 1 ? ql : P.level);
  portal.loadingDone();
  document.getElementById('loading')?.remove();
  requestAnimationFrame(ts => { last = ts; frame(ts); });
  window.__ha = {
    get G() { return G; }, get popup() { return popup; }, get buttons() { return buttons; }, P, tap, startLevel, remaining, cam, camT,
    settle() { quietFx = true; banner = null; clearFx(); holdCoins = 0; dispCoins = P.coins + G.coinsEarned; G.targets.forEach((id, k) => { if (G.found.has(id)) cardBump.set(k, 1); }); },
    findN(n) { for (const id of remaining().slice(0, n)) { const it = G.byId.get(id); tap(it.x, it.y); } },
    client(it) { const p = toStage(it.x, it.y); return { x: p.x * view.sc + view.ox, y: p.y * view.sc + view.oy }; },
    stageToClient(x, y) { return { x: x * view.sc + view.ox, y: y * view.sc + view.oy }; },
  };
}
boot();
